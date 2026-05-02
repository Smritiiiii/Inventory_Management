# Generated migration for cylinder tracking

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0003_remove_category_type_alter_category_name_itemtype'),
    ]

    operations = [
        migrations.CreateModel(
            name='CylinderInventory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(max_length=100)),
                ('cylinder_size', models.CharField(max_length=50)),
                ('filled_quantity', models.PositiveIntegerField(default=0)),
                ('empty_quantity', models.PositiveIntegerField(default=0)),
                ('in_refill_quantity', models.PositiveIntegerField(default=0)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cylinder_inventories', to='integrations.category')),
            ],
            options={
                'unique_together': {('category', 'item_type', 'cylinder_size')},
            },
        ),
        migrations.CreateModel(
            name='CylinderTransaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('item_type', models.CharField(max_length=100)),
                ('cylinder_size', models.CharField(max_length=50)),
                ('transaction_type', models.CharField(choices=[('received_filled', 'Received Filled from Supplier'), ('given_to_customer', 'Given Filled to Customer'), ('received_empty', 'Received Empty from Customer'), ('sent_for_refill', 'Sent to Refill Company'), ('received_refilled', 'Received Refilled from Company'), ('stock_adjustment', 'Stock Adjustment')], max_length=30)),
                ('quantity', models.PositiveIntegerField()),
                ('notes', models.TextField(blank=True, null=True)),
                ('transaction_date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cylinder_transactions', to='integrations.category')),
                ('customer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='integrations.customer')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='integrations.supplier')),
            ],
        ),
    ]
