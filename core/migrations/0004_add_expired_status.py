# Generated manually to add 'expired' status

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0003_alter_visitor_created_at_alter_visitrequest_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='visitrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('approved', 'Approved'),
                    ('rejected', 'Rejected'),
                    ('canceled', 'Canceled'),
                    ('no_show', 'No Show'),
                    ('expired', 'Expired')
                ],
                default='pending',
                max_length=10
            ),
        ),
    ] 