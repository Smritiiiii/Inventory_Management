from django.db.models.signals import pre_save, post_save, post_delete
from django.dispatch import receiver
from .models import CylinderTransaction, CylinderInventory, UserProfile, Supplier
from django.contrib.auth.models import User

# Store old transaction values during pre_save so we can revert during post_save updates
_transaction_old_values = {}
_supplier_old_values = {}


def _delete_inventory_if_empty(inventory):
    """Delete a CylinderInventory record when all quantities are zero."""
    if (
        inventory.filled_quantity == 0
        and inventory.empty_quantity == 0
        and inventory.in_refill_quantity == 0
    ):
        inventory.delete()
    else:
        inventory.save(update_fields=["filled_quantity", "empty_quantity", "in_refill_quantity"])


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile whenever a new User is created"""
    if created:
        UserProfile.objects.create(user=instance, is_admin=False)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile whenever the User is saved"""
    instance.profile.save()


@receiver(pre_save, sender=CylinderTransaction)
def capture_old_transaction_values(sender, instance, **kwargs):
    """Capture old transaction values before they are updated"""
    if instance.pk:  # Only for updates, not new creates
        try:
            old_instance = CylinderTransaction.objects.get(pk=instance.pk)
            _transaction_old_values[instance.pk] = {
                'quantity': old_instance.quantity,
                'transaction_type': old_instance.transaction_type,
                'category': old_instance.category,
                'item_type': old_instance.item_type,
                'cylinder_size': old_instance.cylinder_size,
            }
        except CylinderTransaction.DoesNotExist:
            pass


@receiver(post_save, sender=CylinderTransaction)
def update_inventory_on_transaction(sender, instance, created, **kwargs):
    """Update CylinderInventory when a CylinderTransaction is created or updated"""
    
    # Get or create inventory record for the current transaction values
    inventory, _ = CylinderInventory.objects.get_or_create(
        category=instance.category,
        item_type=instance.item_type,
        cylinder_size=instance.cylinder_size
    )
    
    # If this is an update, revert the old transaction first
    if not created:
        old_data = _transaction_old_values.pop(instance.pk, None)
        if old_data:
            old_quantity = old_data['quantity']
            old_type = old_data['transaction_type']
            old_category = old_data['category']
            old_item_type = old_data['item_type']
            old_cylinder_size = old_data['cylinder_size']

            try:
                old_inventory = CylinderInventory.objects.get(
                    category=old_category,
                    item_type=old_item_type,
                    cylinder_size=old_cylinder_size,
                )
            except CylinderInventory.DoesNotExist:
                old_inventory = None

            if old_inventory:
                # Revert the old transaction's impact
                if old_type == "received_filled":
                    old_inventory.filled_quantity = max(0, old_inventory.filled_quantity - old_quantity)
                elif old_type == "given_to_customer":
                    old_inventory.filled_quantity += old_quantity
                elif old_type == "received_empty":
                    old_inventory.empty_quantity = max(0, old_inventory.empty_quantity - old_quantity)
                elif old_type == "sent_for_refill":
                    old_inventory.empty_quantity += old_quantity
                    old_inventory.in_refill_quantity = max(0, old_inventory.in_refill_quantity - old_quantity)
                elif old_type == "received_refilled":
                    old_inventory.in_refill_quantity += old_quantity
                    old_inventory.filled_quantity = max(0, old_inventory.filled_quantity - old_quantity)
                elif old_type == "stock_adjustment":
                    old_inventory.filled_quantity = max(0, old_inventory.filled_quantity - old_quantity)

                if (
                    old_category == instance.category
                    and old_item_type == instance.item_type
                    and old_cylinder_size == instance.cylinder_size
                ):
                    inventory = old_inventory
                    inventory.save()
                else:
                    _delete_inventory_if_empty(old_inventory)
    
    # Apply the new transaction
    quantity = instance.quantity
    
    if instance.transaction_type == "received_filled":
        inventory.filled_quantity += quantity
    elif instance.transaction_type == "given_to_customer":
        inventory.filled_quantity = max(0, inventory.filled_quantity - quantity)
    elif instance.transaction_type == "received_empty":
        inventory.empty_quantity += quantity
    elif instance.transaction_type == "sent_for_refill":
        inventory.empty_quantity = max(0, inventory.empty_quantity - quantity)
        inventory.in_refill_quantity += quantity
    elif instance.transaction_type == "received_refilled":
        inventory.in_refill_quantity = max(0, inventory.in_refill_quantity - quantity)
        inventory.filled_quantity += quantity
    elif instance.transaction_type == "stock_adjustment":
        inventory.filled_quantity += quantity
    
    inventory.save()


@receiver(post_delete, sender=CylinderTransaction)
def revert_inventory_on_transaction_delete(sender, instance, **kwargs):
    """Revert CylinderInventory changes when a CylinderTransaction is deleted"""
    try:
        inventory = CylinderInventory.objects.get(
            category=instance.category,
            item_type=instance.item_type,
            cylinder_size=instance.cylinder_size
        )
        
        quantity = instance.quantity
        
        if instance.transaction_type == "received_filled":
            inventory.filled_quantity = max(0, inventory.filled_quantity - quantity)
        elif instance.transaction_type == "given_to_customer":
            inventory.filled_quantity += quantity
        elif instance.transaction_type == "received_empty":
            inventory.empty_quantity = max(0, inventory.empty_quantity - quantity)
        elif instance.transaction_type == "sent_for_refill":
            inventory.empty_quantity += quantity
            inventory.in_refill_quantity = max(0, inventory.in_refill_quantity - quantity)
        elif instance.transaction_type == "received_refilled":
            inventory.in_refill_quantity += quantity
            inventory.filled_quantity = max(0, inventory.filled_quantity - quantity)
        elif instance.transaction_type == "stock_adjustment":
            inventory.filled_quantity = max(0, inventory.filled_quantity - quantity)
        
        _delete_inventory_if_empty(inventory)
    except CylinderInventory.DoesNotExist:
        pass

@receiver(pre_save, sender=Supplier)
def capture_old_supplier_values(sender, instance, **kwargs):
    """Capture old supplier values before update"""
    if instance.pk:
        try:
            old_instance = Supplier.objects.get(pk=instance.pk)
            _supplier_old_values[instance.pk] = {
                'quantity_received': old_instance.quantity_received,
                'category': old_instance.category,
                'item_type': old_instance.item_type,
                'cylinder_size': old_instance.cylinder_size,
            }
        except Supplier.DoesNotExist:
            pass


@receiver(post_save, sender=Supplier)
def update_inventory_on_supplier_save(sender, instance, created, **kwargs):
    if instance.category != "cylinder":
        return

    # If update, revert old inventory first using OLD record's identifiers
    if not created:
        old_data = _supplier_old_values.pop(instance.pk, None)
        if old_data and old_data['category'] == "cylinder":
            try:
                old_inventory = CylinderInventory.objects.get(
                    category=old_data['category'],
                    item_type=old_data['item_type'],
                    cylinder_size=old_data['cylinder_size'],
                )
                old_inventory.filled_quantity = max(
                    0, old_inventory.filled_quantity - old_data['quantity_received']
                )
                _delete_inventory_if_empty(old_inventory)
            except CylinderInventory.DoesNotExist:
                pass

    inventory, _ = CylinderInventory.objects.get_or_create(
        category=instance.category,
        item_type=instance.item_type,
        cylinder_size=instance.cylinder_size,
        defaults={"filled_quantity": 0}
    )
    inventory.filled_quantity += instance.quantity_received
    inventory.save(update_fields=["filled_quantity"])


@receiver(post_delete, sender=Supplier)
def revert_inventory_on_supplier_delete(sender, instance, **kwargs):
    """Revert CylinderInventory when a Supplier record is deleted"""
    if instance.category != "cylinder":
        return

    try:
        inventory = CylinderInventory.objects.get(
            category=instance.category,
            item_type=instance.item_type,
            cylinder_size=instance.cylinder_size
        )
        inventory.filled_quantity = max(
            0, inventory.filled_quantity - instance.quantity_received
        )
        _delete_inventory_if_empty(inventory)
    except CylinderInventory.DoesNotExist:
        pass