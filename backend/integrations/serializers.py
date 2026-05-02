from rest_framework import serializers
from .models import *

    
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ItemTypeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = ItemType
        fields = "__all__"

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        quantity = attrs.get("quantity")

        if category and category.name.strip().lower() == "accessory":
            if quantity is None and self.instance is None:
                raise serializers.ValidationError(
                    {"quantity": "Quantity is required for accessory items."}
                )
        else:
            attrs["quantity"] = 0

        return attrs

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'



class DailySaleSerializer(serializers.ModelSerializer):
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
    category_name = serializers.CharField(source='category.name', read_only=True)
    total_quantity = serializers.SerializerMethodField()
    
    class Meta:
        model = CylinderInventory
        fields = ['id', 'category', 'category_name', 'item_type', 'cylinder_size', 
                  'filled_quantity', 'empty_quantity', 'in_refill_quantity', 'total_quantity', 'updated_at']
    
    def get_total_quantity(self, obj):
        return obj.total_quantity()


class CylinderTransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.supplier_name', read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    
    class Meta:
        model = CylinderTransaction
        fields = ['id', 'category', 'category_name', 'item_type', 'cylinder_size', 
                  'transaction_type', 'quantity', 'supplier', 'supplier_name', 
                  'customer', 'customer_name', 'notes', 'transaction_date', 'created_at']

