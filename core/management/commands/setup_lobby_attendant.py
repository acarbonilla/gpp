from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User
from django.contrib.auth.hashers import make_password


class Command(BaseCommand):
    help = 'Set up lobby attendant group and create a sample attendant user'

    def handle(self, *args, **options):
        # Create lobby attendant group
        group, created = Group.objects.get_or_create(name='lobby_attendant')
        if created:
            self.stdout.write(
                self.style.SUCCESS('Successfully created lobby_attendant group')
            )
        else:
            self.stdout.write(
                self.style.WARNING('lobby_attendant group already exists')
            )

        # Create a sample lobby attendant user
        username = 'attendant'
        email = 'attendant@example.com'
        password = 'attendant123'

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'password': make_password(password),
                'first_name': 'Lobby',
                'last_name': 'Attendant',
                'is_staff': True,
            }
        )

        if created:
            # Add user to lobby attendant group
            user.groups.add(group)
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created lobby attendant user: {username}'
                )
            )
            self.stdout.write(
                self.style.SUCCESS(f'Username: {username}, Password: {password}')
            )
        else:
            # Ensure user is in the group
            if group not in user.groups.all():
                user.groups.add(group)
                self.stdout.write(
                    self.style.SUCCESS(f'Added {username} to lobby_attendant group')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'User {username} already exists and is in the group')
                )

        self.stdout.write(
            self.style.SUCCESS('Lobby attendant setup completed successfully!')
        ) 