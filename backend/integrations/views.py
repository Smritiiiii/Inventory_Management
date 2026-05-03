from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.http import HttpResponse
from datetime import timedelta, datetime
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import *
from .serializers import *
from .permissions import IsAdminOrCreateOnly, IsAdminCanDeleteOnly

try:
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

SIZE_ORDER = {"Small": 0, "Medium": 1, "Large": 2}


def _clean_text(value):
    return " ".join(str(value or "").split()).strip()


def _normalize_size(size_value):
    cleaned = _clean_text(size_value)
    if not cleaned:
        return "Unspecified"

    lowered = cleaned.casefold()
    if lowered in {"small", "medium", "large"}:
        return lowered.title()

    return cleaned.title()


def _split_sizes(size_value):
    cleaned = _clean_text(size_value)
    if not cleaned:
        return ["Unspecified"]

    parts = [part.strip() for part in cleaned.split(",") if part.strip()]
    if not parts:
        parts = [cleaned]

    return [_normalize_size(part) for part in parts]


def _normalize_item_type(item_type):
    cleaned = _clean_text(item_type)
    return cleaned or "Unknown"


def _allocate_quantity(quantity, sizes):
    sizes = sizes or ["Unspecified"]
    total_quantity = max(0, int(quantity or 0))
    base_quantity = total_quantity // len(sizes)
    remainder = total_quantity % len(sizes)

    allocations = []
    for index, size in enumerate(sizes):
        allocations.append((size, base_quantity + (1 if index < remainder else 0)))

    return allocations


def _build_inventory_summary():
    rows = {}

    def get_row(item_type, cylinder_size):
        normalized_item_type = _normalize_item_type(item_type)
        normalized_size = _normalize_size(cylinder_size)
        key = (normalized_item_type.casefold(), normalized_size.casefold())

        if key not in rows:
            rows[key] = {
                "id": f"{key[0]}::{key[1]}",
                "item_type": normalized_item_type,
                "cylinder_size": normalized_size,
                "supplier_received": 0,
                "received_filled_quantity": 0,
                "received_refilled_quantity": 0,
                "stock_adjustment_quantity": 0,
                "customer_open_quantity": 0,
                "customer_returned_quantity": 0,
                "unmatched_sales_quantity": 0,
                "given_to_customer_quantity": 0,
                "received_empty_quantity": 0,
                "sent_for_refill_quantity": 0,
            }

        return rows[key]

    suppliers = Supplier.objects.exclude(
        category__iexact="accessory"
    )
    for supplier in suppliers:
        for size, quantity in _allocate_quantity(
            supplier.quantity_received,
            _split_sizes(supplier.cylinder_size),
        ):
            get_row(supplier.item_type, size)["supplier_received"] += quantity

    customers = list(
        Customer.objects.exclude(category__iexact="accessory")
    )
    customer_lookup = {customer.id: customer for customer in customers}

    for customer in customers:
        for size, quantity in _allocate_quantity(
            customer.quantity,
            _split_sizes(customer.cylinder_size),
        ):
            row = get_row(customer.item_type, size)
            if customer.returned_date:
                row["customer_returned_quantity"] += quantity
            else:
                row["customer_open_quantity"] += quantity

    sales = DailySale.objects.filter(sale_type="cylinder")
    for sale in sales:
        # Customer records are treated as the source of truth for the
        # customer's current cylinder position. We only subtract sales that
        # are not tied to an existing customer record.
        if sale.customer_id and sale.customer_id in customer_lookup:
            continue

        for size, quantity in _allocate_quantity(
            sale.quantity,
            _split_sizes(sale.cylinder_size),
        ):
            get_row(sale.item_type, size)["unmatched_sales_quantity"] += quantity

    transactions = CylinderTransaction.objects.exclude(
        category__iexact="accessory"
    )
    for transaction_record in transactions:
        for size, quantity in _allocate_quantity(
            transaction_record.quantity,
            _split_sizes(transaction_record.cylinder_size),
        ):
            row = get_row(transaction_record.item_type, size)
            if transaction_record.transaction_type == "received_filled":
                row["received_filled_quantity"] += quantity
            elif transaction_record.transaction_type == "given_to_customer":
                row["given_to_customer_quantity"] += quantity
            elif transaction_record.transaction_type == "received_empty":
                row["received_empty_quantity"] += quantity
            elif transaction_record.transaction_type == "sent_for_refill":
                row["sent_for_refill_quantity"] += quantity
            elif transaction_record.transaction_type == "received_refilled":
                row["received_refilled_quantity"] += quantity
            elif transaction_record.transaction_type == "stock_adjustment":
                row["stock_adjustment_quantity"] += quantity

    breakdown = []
    totals = {
        "total_received_from_supplier": 0,
        "total_given_to_customers": 0,
        "total_returned_from_customers": 0,
        "total_sent_to_supplier": 0,
        "total_empty_in_stock": 0,
        "total_full_in_stock": 0,
    }

    for row in rows.values():
        total_received_from_supplier = (
            row["supplier_received"] + row["received_filled_quantity"]
        )
        total_given_to_customers = (
            row["customer_open_quantity"]
            + row["customer_returned_quantity"]
            + row["unmatched_sales_quantity"]
            + row["given_to_customer_quantity"]
        )
        total_returned_from_customers = max(
            row["customer_returned_quantity"],
            row["received_empty_quantity"],
        )

        full_in_stock = max(
            0,
            row["supplier_received"]
            + row["received_filled_quantity"]
            + row["received_refilled_quantity"]
            + row["stock_adjustment_quantity"]
            - row["customer_open_quantity"]
            - row["unmatched_sales_quantity"]
            - row["given_to_customer_quantity"],
        )
        empty_in_stock = max(
            0,
            total_returned_from_customers - row["sent_for_refill_quantity"],
        )
        in_refill_quantity = max(
            0,
            row["sent_for_refill_quantity"] - row["received_refilled_quantity"],
        )
        total_in_stock = full_in_stock + empty_in_stock

        totals["total_received_from_supplier"] += total_received_from_supplier
        totals["total_given_to_customers"] += total_given_to_customers
        totals["total_returned_from_customers"] += total_returned_from_customers
        totals["total_sent_to_supplier"] += row["sent_for_refill_quantity"]
        totals["total_empty_in_stock"] += empty_in_stock
        totals["total_full_in_stock"] += full_in_stock

        breakdown.append(
            {
                "id": row["id"],
                "item_type": row["item_type"],
                "cylinder_size": row["cylinder_size"],
                "full_in_stock": full_in_stock,
                "empty_in_stock": empty_in_stock,
                "in_refill_quantity": in_refill_quantity,
                "total_in_stock": total_in_stock,
            }
        )

    breakdown.sort(
        key=lambda item: (
            item["item_type"].casefold(),
            SIZE_ORDER.get(item["cylinder_size"], 99),
            item["cylinder_size"].casefold(),
        )
    )

    totals["breakdown"] = breakdown
    return totals


# ==================== Authentication Views ====================

class RegisterView(APIView):
    """
    User registration endpoint.
    POST /auth/register/
    Required fields: username, email, password, password_confirm, is_admin
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'is_admin': user.profile.is_admin,
                },
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'message': 'Registration successful'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """
    User login endpoint.
    POST /auth/login/
    Required fields: username, password
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        from django.contrib.auth import authenticate
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {'detail': 'Invalid username or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.profile.is_admin,
            },
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })


class CurrentUserView(APIView):
    """
    Get current authenticated user profile.
    GET /auth/current-user/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_admin': user.profile.is_admin if hasattr(user, 'profile') else False,
        })


# ==================== Category & Item ViewSets ====================

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

class ItemTypeViewSet(viewsets.ModelViewSet):
    queryset = ItemType.objects.select_related("created_by").all().order_by("id")
    serializer_class = ItemTypeSerializer
    permission_classes = [IsAdminOrCreateOnly]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent employees from deleting"""
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.select_related("category", "created_by").order_by("-created_at")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrCreateOnly]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent employees from deleting"""
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("category", "created_by").order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrCreateOnly]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent employees from deleting"""
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)


class DailySaleViewSet(viewsets.ModelViewSet):
    serializer_class = DailySaleSerializer
    permission_classes = [IsAdminOrCreateOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['sale_date', 'created_at']
    ordering = ['-sale_date', '-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent employees from deleting"""
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    def get_queryset(self):
        queryset = DailySale.objects.select_related('customer', 'created_by').all()
        
        # Filter by date range if provided
        date_filter = self.request.query_params.get('date_range', None)
        
        if date_filter == 'today':
            today = timezone.now().date()
            queryset = queryset.filter(sale_date=today)
        elif date_filter == 'this_month':
            today = timezone.now().date()
            first_day = today.replace(day=1)
            queryset = queryset.filter(sale_date__gte=first_day, sale_date__lte=today)
        
        return queryset

    def _get_accessory_item(self, item_type_name):
        accessory_item = (
            ItemType.objects.select_for_update()
            .filter(category__iexact="accessory", name=item_type_name)
            .first()
        )
        if not accessory_item:
            raise ValidationError(
                {"item_type": f'Accessory item "{item_type_name}" was not found.'}
            )
        return accessory_item

    def _adjust_accessory_stock(self, sale_type, item_type_name, quantity_delta):
        if sale_type != "accessory" or not item_type_name:
            return

        accessory_item = self._get_accessory_item(item_type_name)

        if quantity_delta < 0 and accessory_item.quantity < abs(quantity_delta):
            raise ValidationError(
                {
                    "quantity": (
                        f'Only {accessory_item.quantity} "{accessory_item.name}" '
                        "item(s) are currently in stock."
                    )
                }
            )

        accessory_item.quantity += quantity_delta
        accessory_item.save(update_fields=["quantity"])

    def _validate_cylinder_sale(self, sale_type, category, item_type, cylinder_size, quantity):
        """Validate that there are enough cylinders of the specified type and size available for sale"""
        if sale_type != "cylinder":
            return

        # Check if cylinder inventory exists with sufficient quantity
        cylinder_inventory = CylinderInventory.objects.select_for_update().filter(
            category=category,
            item_type=item_type,
            cylinder_size=cylinder_size
        ).first()

        if not cylinder_inventory or cylinder_inventory.filled_quantity < quantity:
            available = cylinder_inventory.filled_quantity if cylinder_inventory else 0
            raise ValidationError(
                {
                    "quantity": (
                        f'Only {available} {item_type} {cylinder_size} cylinder(s) are '
                        f'available in stock. Requested: {quantity}'
                    )
                }
            )

        # Deduct from filled inventory
        cylinder_inventory.filled_quantity -= quantity
        cylinder_inventory.save(update_fields=["filled_quantity"])

    def _restore_cylinder_inventory(self, sale_type, category, item_type, cylinder_size, quantity):
        """Restore cylinder inventory when a sale is cancelled or deleted"""
        if sale_type != "cylinder":
            return

        cylinder_inventory = CylinderInventory.objects.select_for_update().filter(
            category=category,
            item_type=item_type,
            cylinder_size=cylinder_size
        ).first()

        if cylinder_inventory:
            cylinder_inventory.filled_quantity += quantity
            cylinder_inventory.save(update_fields=["filled_quantity"])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            sale_type = serializer.validated_data.get("sale_type")
            item_type = serializer.validated_data.get("item_type")
            quantity = serializer.validated_data.get("quantity") or 0
            category = serializer.validated_data.get("category")
            cylinder_size = serializer.validated_data.get("cylinder_size")

            # Validate cylinder sales
            if sale_type == "cylinder":
                self._validate_cylinder_sale(sale_type, category, item_type, cylinder_size, quantity)
            
            # Adjust accessory stock
            self._adjust_accessory_stock(sale_type, item_type, -quantity)
            self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Restore old inventory first
            if instance.sale_type == "cylinder":
                self._restore_cylinder_inventory(
                    instance.sale_type,
                    instance.category,
                    instance.item_type,
                    instance.cylinder_size,
                    instance.quantity or 0,
                )
            
            self._adjust_accessory_stock(
                instance.sale_type,
                instance.item_type,
                instance.quantity or 0,
            )

            new_sale_type = serializer.validated_data.get("sale_type", instance.sale_type)
            new_item_type = serializer.validated_data.get("item_type", instance.item_type)
            new_quantity = serializer.validated_data.get("quantity", instance.quantity) or 0
            new_category = serializer.validated_data.get("category", instance.category)
            new_cylinder_size = serializer.validated_data.get("cylinder_size", instance.cylinder_size)

            # Validate new cylinder sale if applicable
            if new_sale_type == "cylinder":
                self._validate_cylinder_sale(new_sale_type, new_category, new_item_type, new_cylinder_size, new_quantity)
            
            self._adjust_accessory_stock(new_sale_type, new_item_type, -new_quantity)
            self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        with transaction.atomic():
            # Restore cylinder inventory
            if instance.sale_type == "cylinder":
                self._restore_cylinder_inventory(
                    instance.sale_type,
                    instance.category,
                    instance.item_type,
                    instance.cylinder_size,
                    instance.quantity or 0,
                )
            
            self._adjust_accessory_stock(
                instance.sale_type,
                instance.item_type,
                instance.quantity or 0,
            )
            self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)


class CylinderInventoryViewSet(viewsets.ModelViewSet):
    queryset = CylinderInventory.objects.select_related('category').all()
    serializer_class = CylinderInventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item_type', 'cylinder_size']
    ordering_fields = ['updated_at']
    ordering = ['-updated_at']


class CylinderTransactionViewSet(viewsets.ModelViewSet):
    queryset = CylinderTransaction.objects.select_related(
        'category', 'supplier', 'customer', 'created_by'
    ).all()
    serializer_class = CylinderTransactionSerializer
    permission_classes = [IsAdminOrCreateOnly]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['transaction_date', 'created_at']
    ordering = ['-transaction_date', '-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current_inventory_summary(self, request):
        """Get current inventory summary for dashboard"""
        return Response(_build_inventory_summary())
