from django.contrib import admin
from .models import CustomUser, StudentProfile, AuthorityProfile, Grievance

# This makes the forms appear in the Admin Panel
admin.site.register(CustomUser)
admin.site.register(StudentProfile)
admin.site.register(AuthorityProfile)
admin.site.register(Grievance)