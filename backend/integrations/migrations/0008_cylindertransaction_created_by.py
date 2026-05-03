from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("integrations", "0007_customer_created_by_dailysale_created_by_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="cylindertransaction",
            name="created_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="cylinder_transactions_created",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
