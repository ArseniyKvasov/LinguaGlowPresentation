# Generated by Django 5.1.4 on 2025-03-25 07:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hub", "0012_audio_title_image_title_labelimages_title_test_title_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="fillintheblanks",
            name="display_format",
            field=models.CharField(
                choices=[("withList", "With list"), ("withoutList", "Without list")],
                default="withList",
                max_length=20,
            ),
        ),
    ]
