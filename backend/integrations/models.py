
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

class ItemType(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="types")
    name = models.CharField(max_length=100)
    quantity = models.PositiveIntegerField(default=0)  # For tracking accessory quantities

    class Meta:
        unique_together = ('category', 'name')

class Supplier(models.Model):
    supplier_name = models.CharField(max_length=150)

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="supplier_records"
    )

    item_type = models.CharField(max_length=100)
    item_name = models.CharField(max_length=150, blank=True, null=True)

    cylinder_size = models.CharField(max_length=50)

    quantity_received = models.PositiveIntegerField()

    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)

    date_received = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.supplier_name


class Customer(models.Model):
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    address = models.TextField()

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="customers"
    )

    item_type = models.CharField(max_length=100)
    cylinder_size = models.CharField(max_length=50)

    quantity = models.PositiveIntegerField()

    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_date = models.DateField()
    returned_date = models.DateField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name


class DailySale(models.Model):
    SALE_TYPE_CHOICES = (
        ("cylinder", "Cylinder"),
        ("accessory", "Accessory"),
    )

    id = models.AutoField(primary_key=True)

    sale_type = models.CharField(
        max_length=20,
        choices=SALE_TYPE_CHOICES
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    category = models.CharField(max_length=50)  

    cylinder_size = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    item_type = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    quantity = models.PositiveIntegerField(default=1)

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    refill = models.BooleanField(default=False)

    sale_date = models.DateField(auto_now_add=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sale_type} - {self.customer or 'Accessory'} - {self.sale_date}"


class CylinderInventory(models.Model):
    """Tracks current filled and empty cylinder stock"""
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="cylinder_inventories")
    item_type = models.CharField(max_length=100)
    cylinder_size = models.CharField(max_length=50)
    
    filled_quantity = models.PositiveIntegerField(default=0)
    empty_quantity = models.PositiveIntegerField(default=0)
    in_refill_quantity = models.PositiveIntegerField(default=0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('category', 'item_type', 'cylinder_size')
    
    def total_quantity(self):
        return self.filled_quantity + self.empty_quantity + self.in_refill_quantity
    
    def __str__(self):
        return f"{self.category.name} - {self.item_type} ({self.cylinder_size})"


class CylinderTransaction(models.Model):
    """Log all cylinder movements for audit trail"""
    TRANSACTION_TYPE_CHOICES = (
        ("received_filled", "Received Filled from Supplier"),
        ("given_to_customer", "Given Filled to Customer"),
        ("received_empty", "Received Empty from Customer"),
        ("sent_for_refill", "Sent to Refill Company"),
        ("received_refilled", "Received Refilled from Company"),
        ("stock_adjustment", "Stock Adjustment"),
    )
    
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="cylinder_transactions")
    item_type = models.CharField(max_length=100)
    cylinder_size = models.CharField(max_length=50)
    
    transaction_type = models.CharField(max_length=30, choices=TRANSACTION_TYPE_CHOICES)
    quantity = models.PositiveIntegerField()
    
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    
    notes = models.TextField(blank=True, null=True)
    
    transaction_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.transaction_type} - {self.quantity} x {self.cylinder_size} ({self.transaction_date})"
