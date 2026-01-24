from django.db import models
from django.contrib.auth.models import AbstractUser

# 1. CENTRAL USER TABLE (Login Credentials)
class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('authority', 'Authority'),
        ('admin', 'Admin'),
    )
    user_type = models.CharField(max_length=30, choices=USER_TYPE_CHOICES)
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

# 2. STUDENT DETAILS
class StudentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='student_profile')
    student_id = models.CharField(max_length=15, unique=True) # Ex: N180000
    year = models.CharField(max_length=10) # Ex: E4
    branch = models.CharField(max_length=100, null=True, blank=True) # Ex: CSE
    gender = models.CharField(max_length=10)

    def __str__(self):
        return self.student_id

# 3. AUTHORITY DETAILS
class AuthorityProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='authority_profile')
    employee_id = models.CharField(max_length=15, unique=True)
    department = models.CharField(max_length=50) # Ex: Hostel, Mess
    designation = models.CharField(max_length=50) # Ex: Warden
    gender = models.CharField(max_length=10)

    def __str__(self):
        return f"{self.designation} - {self.department}"

# 4. THE COMPLAINT (Grievance)
class Grievance(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    category = models.CharField(max_length=255) # E.g. "Hostel - I1 - Electrical"
    description = models.TextField()
    image = models.ImageField(upload_to='grievance_imgs/', blank=True, null=True)

    resolved_image = models.ImageField(upload_to='resolved_imgs/', blank=True, null=True)
    
    status = models.CharField(max_length=20, default='Pending') # Pending, Resolved, Escalated
    authority_reply = models.TextField(blank=True, null=True)
    feedback_stars = models.IntegerField(default=0)
    
    # --- NEW FIELDS FOR HIERARCHY ---
    # Stores who is currently responsible (e.g., "Chief Warden")
    current_handler_designation = models.CharField(max_length=100, blank=True, null=True)
    
    # Stores the Department (e.g., "Hostel") to help with lookup
    department_category = models.CharField(max_length=50, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.category}"