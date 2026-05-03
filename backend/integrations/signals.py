from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import CylinderTransaction, CylinderInventory, UserProfile
from django.contrib.auth.models import User

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile whenever a new User is created"""
    if created:
        UserProfile.objects.create(user=instance, is_admin=False)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile whenever the User is saved"""
    instance.profile.save()

@receiver(post_save, sender=CylinderTransaction)
def update_inventory_on_transaction(sender, instance, created, **kwargs):
    """Update CylinderInventory when a CylinderTransaction is created or updated"""
    if not created:
        return  # Only handle creation, not updates
    
    # Get or create inventory record
    inventory, _ = CylinderInventory.objects.get_or_create(
        category=instance.category,
        item_type=instance.item_type,
        cylinder_size=instance.cylinder_size
    )
    
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
        # For adjustments, assume it's adding filled cylinders
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
        
        inventory.save()
    except CylinderInventory.DoesNotExist:
        pass
