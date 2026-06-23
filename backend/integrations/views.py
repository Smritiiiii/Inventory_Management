from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.auth import authenticate
import json
from datetime import timedelta, datetime, date
from django.db import transaction
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from rest_framework.exceptions import ValidationError
from .models import *
from .serializers import *
from .permissions import IsAdminOrCreateOnly, IsAdminCanDeleteOnly


def _build_inventory_summary(start_date=None, end_date=None):
    totals = {
        "total_received_from_supplier": 0,
        "total_given_to_customers": 0,
        "total_returned_from_customers": 0,
        "total_sent_to_supplier": 0,
        "total_empty_in_stock": 0,
        "total_full_in_stock": 0,
        "breakdown": [],
    }

    # Build filters for optional date range
    supplier_filter = Q(category__iexact="cylinder")
    transaction_filter = Q(category__iexact="cylinder")
    customer_filter = Q(category__iexact="cylinder")
    daily_sales_filter = Q(category__iexact="cylinder", refill=True)
    
    if start_date and end_date:
        supplier_filter &= Q(date_received__gte=start_date, date_received__lte=end_date)
        transaction_filter &= Q(transaction_date__gte=start_date, transaction_date__lte=end_date)
        customer_filter &= Q(deposit_date__gte=start_date, deposit_date__lte=end_date)
        daily_sales_filter &= Q(sale_date__gte=start_date, sale_date__lte=end_date)

    supplier_received = Supplier.objects.filter(
        supplier_filter
    ).aggregate(total=Coalesce(Sum("quantity_received"), 0))["total"]

    totals["total_received_from_supplier"] = supplier_received 

    customer_sales = Customer.objects.filter(
        customer_filter,
        returned_date__isnull=True,
    ).aggregate(total=Coalesce(Sum("quantity"), 0))["total"]

    daily_sales = DailySale.objects.filter(
        daily_sales_filter
    ).aggregate(total=Coalesce(Sum("quantity"), 0))["total"]

    empty_from_transactions = CylinderTransaction.objects.filter(
        transaction_filter,
        transaction_type="received_empty"
    ).aggregate(total=Coalesce(Sum("quantity"), 0))["total"]

    # customer_filter for deposits — filter by deposit_date (already correct)
    customer_filter = Q(category__iexact="cylinder")
    if start_date and end_date:
        customer_filter &= Q(deposit_date__gte=start_date, deposit_date__lte=end_date)

    # returned_filter — completely separate, filter only by returned_date
    returned_filter = Q(category__iexact="cylinder", returned_date__isnull=False)
    if start_date and end_date:
        returned_filter &= Q(returned_date__gte=start_date, returned_date__lte=end_date)
    
    returned_from_customers = Customer.objects.filter(
        returned_filter
    ).aggregate(total=Coalesce(Sum("quantity"), 0))["total"]

    
    totals["total_given_to_customers"] = max(
        0,
        customer_sales + daily_sales,
    )

    totals["total_sent_to_supplier"] = CylinderTransaction.objects.filter(
        transaction_filter,
        transaction_type="sent_for_refill",
    ).aggregate(total=Coalesce(Sum("quantity"), 0))["total"]
    totals["total_empty_in_stock"] = empty_from_transactions + returned_from_customers - daily_sales - totals["total_sent_to_supplier"] 
    totals["total_returned_from_customers"] = empty_from_transactions + returned_from_customers
    totals["total_full_in_stock"] = supplier_received - totals["total_given_to_customers"] 

    breakdown_map = {}

    # Step 1: Add quantities received from suppliers per item_type + cylinder_size
    for row in Supplier.objects.filter(supplier_filter).values("item_type", "cylinder_size").annotate(total=Coalesce(Sum("quantity_received"), 0)):
        key = (row["item_type"].strip().title(), row["cylinder_size"].strip().title())
        breakdown_map.setdefault(key, {"received": 0, "given": 0, "returned": 0, "refilled": 0})
        breakdown_map[key]["received"] += row["total"]

    # Step 2: Add refilled/received_filled from CylinderTransaction per item_type + cylinder_size
    for row in CylinderTransaction.objects.filter(
        transaction_filter,
        transaction_type__in=["received_refilled", "received_filled"]
    ).values("item_type", "cylinder_size").annotate(total=Coalesce(Sum("quantity"), 0)):
        key = (row["item_type"].strip().title(), row["cylinder_size"].strip().title())
        breakdown_map.setdefault(key, {"received": 0, "given": 0, "returned": 0, "refilled": 0})
        breakdown_map[key]["refilled"] += row["total"]

    # Step 3: Add all customer quantities given out per item_type + cylinder_size
    for row in Customer.objects.filter(customer_filter).values("item_type", "cylinder_size").annotate(total=Coalesce(Sum("quantity"), 0)):
        key = (row["item_type"].strip().title(), row["cylinder_size"].strip().title())
        breakdown_map.setdefault(key, {"received": 0, "given": 0, "returned": 0, "refilled": 0})
        breakdown_map[key]["given"] += row["total"]

    # Step 4: Add back returned quantities per item_type + cylinder_size
    for row in Customer.objects.filter(
        returned_filter
    ).values("item_type", "cylinder_size").annotate(total=Coalesce(Sum("quantity"), 0)):
        key = (row["item_type"].strip().title(), row["cylinder_size"].strip().title())
        breakdown_map.setdefault(key, {"received": 0, "given": 0, "returned": 0, "refilled": 0})
        breakdown_map[key]["returned"] += row["total"]

    # Step 5: Also subtract daily_sales per item_type + cylinder_size
    for row in DailySale.objects.filter(
        daily_sales_filter
    ).values("item_type", "cylinder_size").annotate(total=Coalesce(Sum("quantity"), 0)):
        key = (row["item_type"].strip().title(), row["cylinder_size"].strip().title())
        breakdown_map.setdefault(key, {"received": 0, "given": 0, "returned": 0, "refilled": 0})
        breakdown_map[key]["given"] += row["total"]

    # Build final breakdown list
    breakdown = []
    for (item_type, cylinder_size), values in sorted(breakdown_map.items()):
        full_in_stock = max(0, values["received"] + values["refilled"] - values["given"] + values["returned"])
        breakdown.append({
            "item_type": item_type,
            "cylinder_size": cylinder_size,
            "full_in_stock": full_in_stock,
        })

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


# ==================== Item ViewSets ====================


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
    queryset = Supplier.objects.select_related("created_by").order_by("-created_at")
    serializer_class = SupplierSerializer
    permission_classes = [IsAdminOrCreateOnly]

    def create(self, request, *args, **kwargs):
        raw_size_quantities = request.data.get("size_quantities") or request.data.get("sizeQuantities")
        if raw_size_quantities:
            try:
                if isinstance(raw_size_quantities, str):
                    raw_size_quantities = json.loads(raw_size_quantities)
            except (ValueError, TypeError):
                raise ValidationError({"size_quantities": "Invalid JSON for size_quantities."})

            if isinstance(raw_size_quantities, list):
                entries = raw_size_quantities
            elif isinstance(raw_size_quantities, dict):
                entries = [
                    {"cylinder_size": size, "quantity": quantity}
                    for size, quantity in raw_size_quantities.items()
                ]
            else:
                raise ValidationError(
                    {"size_quantities": "Expected a list or object of size quantities."}
                )

            created = []
            with transaction.atomic():
                for i, entry in enumerate(entries):
                    cylinder_size = entry.get("cylinder_size")
                    new_quantity = int(entry.get("quantity") or 0)
                    date_received = request.data.get("date_received")

                    entry_total_amount = float(
                        entry.get("total_amount") or entry.get("totalAmount") or 0
                    )

                    # None means "user left it blank" vs 0 meaning "user typed 0"
                    new_amount_paid_raw = request.data.get("amount_paid")
                    new_amount_paid = (
                        float(new_amount_paid_raw)
                        if new_amount_paid_raw not in (None, "", 0, "0")
                        else None
                    )

                    # Check if a record with the same key + same date already exists
                    existing = Supplier.objects.filter(
                        supplier_name=request.data.get("supplier_name"),
                        category=request.data.get("category"),
                        item_type=request.data.get("item_type"),
                        cylinder_size=cylinder_size,
                        date_received=date_received,
                    ).first()

                    if existing:
                        # ── MERGE into existing record ──
                        old_total = float(existing.total_amount or 0)
                        old_paid = float(existing.amount_paid or 0)

                        existing.quantity_received += new_quantity
                        existing.total_amount = old_total + entry_total_amount

                        # Only add to amount_paid if user explicitly sent a value
                        if new_amount_paid is not None and i == 0:
                            existing.amount_paid = old_paid + new_amount_paid
                        # else: leave amount_paid untouched

                        existing.save()  # signal fires here and updates inventory correctly
                        created.append(SupplierSerializer(existing).data)

                    else:
                        # ── CREATE new record ──
                        data = request.data.copy()
                        data.pop("size_quantities", None)
                        data.pop("sizeQuantities", None)
                        data["cylinder_size"] = cylinder_size
                        data["quantity_received"] = new_quantity
                        data["total_amount"] = entry_total_amount
                        data["amount_paid"] = (new_amount_paid if new_amount_paid is not None else 0) if i == 0 else 0

                        serializer = self.get_serializer(data=data)
                        serializer.is_valid(raise_exception=True)
                        serializer.save(created_by=request.user)
                        created.append(serializer.data)

            return Response(created, status=status.HTTP_201_CREATED)

        # ── single entry fallback (no size_quantities) ──
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("created_by").order_by("-created_at")
    serializer_class = CustomerSerializer
    permission_classes = [IsAdminOrCreateOnly]
    
    def _validate_cylinder_sale(self, category, item_type, cylinder_size, quantity):
        if category != "cylinder":
            return

        cylinder_inventory = CylinderInventory.objects.select_for_update().filter(
            category=category,
            item_type=item_type,
            cylinder_size=cylinder_size,
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

        cylinder_inventory.filled_quantity -= quantity
        cylinder_inventory.save(update_fields=["filled_quantity"])

    def _restore_cylinder_inventory(self, category, item_type, cylinder_size, quantity):
        if category != "cylinder":
            return

        cylinder_inventory = CylinderInventory.objects.select_for_update().filter(
            category=category,
            item_type=item_type,
            cylinder_size=cylinder_size,
        ).first()

        if cylinder_inventory:
            cylinder_inventory.filled_quantity += quantity
            cylinder_inventory.save(update_fields=["filled_quantity"])

    def create(self, request, *args, **kwargs):
        raw_size_quantities = request.data.get("size_quantities") or request.data.get("sizeQuantities")
        if raw_size_quantities:   
            try:
                if isinstance(raw_size_quantities, str):
                    raw_size_quantities = json.loads(raw_size_quantities)
            except (ValueError, TypeError):
                raise ValidationError({"size_quantities": "Invalid JSON for size_quantities."})

            if isinstance(raw_size_quantities, list):
                entries = raw_size_quantities
            elif isinstance(raw_size_quantities, dict):
                entries = [
                    {"cylinder_size": size, "quantity": quantity}
                    for size, quantity in raw_size_quantities.items()
                ]
            else:
                raise ValidationError(
                    {"size_quantities": "Expected a list or object of size quantities."}
                )
            created = []
            with transaction.atomic():
                for entry in entries:
                    cylinder_size = entry.get("cylinder_size")
                    new_quantity = int(entry.get("quantity") or 0)
                    deposit_amount = float(entry.get("deposit_amount") or entry.get("depositAmount") or 0)
                    deposit_date = request.data.get("deposit_date")

                    existing = Customer.objects.filter(
                        full_name=request.data.get("full_name"),
                        phone=request.data.get("phone"),
                        item_type=request.data.get("item_type"),
                        cylinder_size=cylinder_size,
                        deposit_date=deposit_date,
                    ).first()


                    if existing:
                        existing.quantity += new_quantity
                        existing.deposit_amount = float(existing.deposit_amount or 0) + deposit_amount
                        existing.save()
                        created.append(CustomerSerializer(existing).data)
                    else:
                        data = dict(request.data)
                        data.pop("size_quantities", None)
                        data.pop("sizeQuantities", None)
                        data["cylinder_size"] = cylinder_size
                        data["quantity"] = new_quantity
                        if deposit_amount:
                            data["deposit_amount"] = deposit_amount

                        serializer = self.get_serializer(data=data)
                        serializer.is_valid(raise_exception=True)
                        validated = serializer.validated_data
                        if validated.get("category") == "cylinder":
                            self._validate_cylinder_sale(
                                validated.get("category"),
                                validated.get("item_type"),
                                validated.get("cylinder_size"),
                                validated.get("quantity") or 0,
                            )
                        serializer.save(created_by=request.user)
                        created.append(serializer.data)

            return Response(created, status=status.HTTP_201_CREATED)

        # ── single entry fallback ──
        existing = Customer.objects.filter(
            full_name=request.data.get("full_name"),
            phone=request.data.get("phone"),
            item_type=request.data.get("item_type"),
            cylinder_size=request.data.get("cylinder_size"),
            deposit_date=request.data.get("deposit_date"),
        ).first()
          
        if existing:
            existing.quantity += int(request.data.get("quantity") or 0)
            existing.deposit_amount = float(existing.deposit_amount or 0) + float(request.data.get("deposit_amount") or 0)
            existing.save()
            return Response(CustomerSerializer(existing).data, status=status.HTTP_200_OK)  # ← fixed: use CustomerSerializer, not `created`

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            validated_data = serializer.validated_data
            if validated_data.get("category") == "cylinder":
                self._validate_cylinder_sale(
                    validated_data.get("category"),
                    validated_data.get("item_type"),
                    validated_data.get("cylinder_size"),
                    validated_data.get("quantity") or 0,
                )
            self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            if instance.category == "cylinder":
                self._restore_cylinder_inventory(
                    instance.category,
                    instance.item_type,
                    instance.cylinder_size,
                    instance.quantity or 0,
                )

            new_category = serializer.validated_data.get("category", instance.category)
            new_item_type = serializer.validated_data.get("item_type", instance.item_type)
            new_cylinder_size = serializer.validated_data.get("cylinder_size", instance.cylinder_size)
            new_quantity = serializer.validated_data.get("quantity", instance.quantity) or 0

            if new_category == "cylinder":
                self._validate_cylinder_sale(
                    new_category,
                    new_item_type,
                    new_cylinder_size,
                    new_quantity,
                )

            self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Override destroy to prevent employees from deleting"""
        if not (hasattr(request.user, 'profile') and request.user.profile.is_admin):
            return Response(
                {'detail': 'Employees cannot delete records.'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()

        with transaction.atomic():
            if instance.category == "cylinder":
                self._restore_cylinder_inventory(
                    instance.category,
                    instance.item_type,
                    instance.cylinder_size,
                    instance.quantity or 0,
                )
            self.perform_destroy(instance)

        return Response(status=status.HTTP_204_NO_CONTENT)


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


class CylinderTransactionViewSet(viewsets.ModelViewSet):
    queryset = CylinderTransaction.objects.select_related(
        'supplier', 'customer', 'created_by'
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
        """Get current inventory summary for dashboard with optional date filtering"""
        time_range = request.query_params.get('time_range', 'all')
        month = request.query_params.get('month', None)
        
        start_date = None
        end_date = None
        today = date.today()
        
        if time_range == 'today':
            start_date = today
            end_date = today
        elif time_range == 'this_month':
            start_date = today.replace(day=1)
            # Calculate last day of current month
            if today.month == 12:
                end_date = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end_date = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        elif time_range == 'pick_month' and month:
            # month format: "YYYY-MM"
            try:
                year, month_num = map(int, month.split('-'))
                start_date = date(year, month_num, 1)
                # Calculate last day of the month
                if month_num == 12:
                    end_date = date(year + 1, 1, 1) - timedelta(days=1)
                else:
                    end_date = date(year, month_num + 1, 1) - timedelta(days=1)
            except (ValueError, AttributeError):
                pass  # Invalid month format, no filtering
        
        return Response(_build_inventory_summary(start_date, end_date))
