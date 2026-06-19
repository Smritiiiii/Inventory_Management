from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    is_admin = serializers.BooleanField(default=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password_confirm', 'is_admin']
        extra_kwargs = {
            'email': {'required': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "This email is already registered."})
        
        return attrs
    
    def create(self, validated_data):
        is_admin = validated_data.pop('is_admin', False)
        validated_data.pop('password_confirm')
        
        user = User.objects.create_user(**validated_data)
        user.profile.is_admin = is_admin
        user.profile.save()
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_admin']


    
class ItemTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="get_category_display", read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = ItemType
        fields = "__all__"

    def validate(self, attrs):
        category = attrs.get("category")
        quantity = attrs.get("quantity")

        if category == "accessory":
            if quantity is None and self.instance is None:
                raise serializers.ValidationError(
                    {"quantity": "Quantity is required for accessory items."}
                )
        else:
            attrs["quantity"] = 0

        return attrs

class SupplierSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = Supplier
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'



class DailySaleSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = DailySale
        fields = "__all__"

    def validate(self, data):
        sale_type = data.get("sale_type") or getattr(self.instance, "sale_type", None)

        if sale_type == "cylinder":
            customer = data.get("customer") or getattr(self.instance, "customer", None)
            if not customer:
                raise serializers.ValidationError(
                    "Customer is required for cylinder sales."
                )

        if sale_type == "accessory":
            # No customer required
            data["customer"] = None
            data["phone"] = None
            data["address"] = None
            if not data.get("item_type") and not getattr(self.instance, "item_type", None):
                raise serializers.ValidationError(
                    {"item_type": "Accessory item type is required."}
                )

        return data


class CylinderInventorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="get_category_display", read_only=True)
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = CylinderInventory
        fields = ['id', 'category', 'category_name', 'item_type', 'cylinder_size', 
                  'filled_quantity', 'empty_quantity', 'in_refill_quantity', 'total_quantity', 'updated_at']
    
    def get_total_quantity(self, obj):
        return obj.total_quantity()


class CylinderTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="get_category_display", read_only=True)
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    created_by_name = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = CylinderTransaction
        fields = ['id', 'category', 'category_name', 'item_type', 'cylinder_size', 
                  'transaction_type', 'quantity', 'supplier', 'supplier_name', 
                  'customer', 'customer_name', 'notes', 'transaction_date',
                  'created_by', 'created_by_name', 'created_at']

