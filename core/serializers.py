from rest_framework import serializers
from .models import CustomUser, StudentProfile, AuthorityProfile, Grievance
from .models import SiteSettings

# 1. USER SERIALIZER
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'user_type', 'first_name', 'last_name']

# 2. STUDENT SERIALIZER
class StudentSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['student_id', 'year', 'branch', 'gender', 'email', 'name']

# 3. AUTHORITY SERIALIZER
class AuthoritySerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)

    profile_pic = serializers.ImageField(source='user.profile_pic', read_only=True)

    class Meta:
        model = AuthorityProfile
        fields = ['employee_id', 'department', 'designation', 'gender', 'email', 'name', 'profile_pic']

# 4. GRIEVANCE SERIALIZER
class GrievanceSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_name = serializers.CharField(source='student.user.first_name', read_only=True)
    
    class Meta:
        model = Grievance
        fields = '__all__'

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'