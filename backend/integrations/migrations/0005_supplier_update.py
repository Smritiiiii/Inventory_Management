# Migration to update Supplier model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('integrations', '0004_cylinder_tracking'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='supplier',
            name='quantity_returned',
        ),
        migrations.AddField(
            model_name='supplier',
            name='date_received',
            field=models.DateField(null=True, blank=True),
        ),
    ]
