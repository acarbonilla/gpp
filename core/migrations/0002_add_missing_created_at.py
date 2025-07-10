# Generated manually to fix missing created_at column

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='visitor',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
    ] 