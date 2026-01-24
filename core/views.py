from rest_framework.decorators import api_view, parser_classes, permission_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import CustomUser, StudentProfile, AuthorityProfile, Grievance
from .serializers import GrievanceSerializer, StudentSerializer, AuthoritySerializer
from datetime import timedelta # Add this if missing

# ==========================
# 1. AUTHENTICATION
# ==========================
@api_view(['POST'])
def login_api(request):
    raw_username = request.data.get('username')
    password = request.data.get('password')
    
    # Attempt 1: Exact Match
    user = authenticate(username=raw_username, password=password)
    
    # Attempt 2: Uppercase Match
    if user is None and raw_username:
        user = authenticate(username=raw_username.upper(), password=password)
    
    if user:
        role = user.user_type
        if user.is_superuser:
            role = 'admin'
        if not role:
            role = 'student' 

        return Response({
            'status': 'success',
            'user_type': role,
            'token': f"token_{user.id}_{user.username}",
            'username': user.username,
            'name': user.first_name
        })
    else:
        return Response({'status': 'error', 'message': 'Invalid Credentials'}, status=401)

# ==========================
# 2. ADMIN ACTIONS (Register)
# ==========================
@api_view(['POST'])
def register_student(request):
    data = request.data
    try:
        # Force ID to Uppercase for consistency
        s_id = data['id'].upper()
        user = CustomUser.objects.create_user(
            username=s_id, email=data['email'], password=data['password'],
            first_name=data['name'], user_type='student'
        )
        StudentProfile.objects.create(
            user=user, student_id=s_id, year=data['year'],
            branch=data.get('branch', ''), gender=data['gender']
        )
        return Response({'status': 'success'})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=400)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser]) # Added to support photo upload during register if needed
def register_authority(request):
    data = request.data
    try:
        user = CustomUser.objects.create_user(
            username=data['id'], email=data['email'], password=data['password'],
            first_name=data['name'], user_type='authority'
        )
        
        # Handle Photo if sent during registration
        if 'image' in request.FILES:
            user.profile_pic = request.FILES['image']
            user.save()

        AuthorityProfile.objects.create(
            user=user, employee_id=data['id'], department=data['dept'],
            designation=data['designation'], gender=data['gender']
        )
        return Response({'status': 'success'})
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=400)

# ==========================
# 3. GRIEVANCE HANDLING
# ==========================
@api_view(['GET', 'POST', 'PATCH', 'DELETE'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def grievance_api(request):
    if request.method == 'GET':
        user_id = request.GET.get('user_id')
        role = request.GET.get('role')
        
        grievances = Grievance.objects.all().order_by('-created_at')

        if role == 'student' and user_id:
             try:
                 student_profile = StudentProfile.objects.get(student_id=user_id)
                 grievances = grievances.filter(student=student_profile)
             except:
                 return Response([])
        elif role == 'authority' and user_id:
             try:
                 # Find out who this authority is (e.g., "Chief Warden")
                 auth_profile = AuthorityProfile.objects.get(employee_id=user_id)
                 my_designation = auth_profile.designation
                 
                 # Only show grievances assigned to THIS designation
                 grievances = grievances.filter(current_handler_designation=my_designation)
             except:
                 return Response([])

        serializer = GrievanceSerializer(grievances, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        try:
            student_id = request.data.get('student_id')
            student = StudentProfile.objects.get(student_id=student_id)
            
            full_category = request.data.get('category') # e.g. "Hostel - I1 - Electrical"
            
            # 1. Determine Hierarchy Start Point
            # Logic: Extract the first word to find Department
            dept_map = {
                'Hostel': 'Chief Warden',
                'Mess': 'Chief Mess Coordinator',
                'Academic': 'Dean Academics',
                'Hospital': 'Chief Medical Officer',
                'Sports/Gym': 'Chief Sports Coordinator',
                'Ragging': 'DIRECTOR',
                'Others': 'AO',
                'Administration': 'AO'
            }
            
            # Extract dept from string "Hostel - I1..."
            main_dept = full_category.split(' - ')[0] 
            initial_handler = dept_map.get(main_dept, 'AO') # Default to AO if unknown

            Grievance.objects.create(
                student=student,
                category=full_category,
                description=request.data.get('description'),
                image=request.data.get('image'),
                department_category=main_dept,       # Save Dept
                current_handler_designation=initial_handler # Assign to Lowest Level
            )
            return Response({'status': 'success', 'message': 'Grievance lodged'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)

    elif request.method == 'PATCH':
        try:
            g_id = request.data.get('id')
            grievance = Grievance.objects.get(id=g_id)
            
            # If resolving (Authority)
            if 'status' in request.data:
                grievance.status = request.data.get('status')
                grievance.authority_reply = request.data.get('reply')
                
                # --- NEW: Handle Resolution Image ---
                if 'resolved_image' in request.FILES:
                    grievance.resolved_image = request.FILES['resolved_image']
                
                grievance.resolved_at = timezone.now()
            
            # If giving feedback (Student)
            if 'feedback_stars' in request.data:
                grievance.feedback_stars = request.data.get('feedback_stars')
                
            grievance.save()
            return Response({'status': 'success'})
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        g_id = request.GET.get('id')
        student_id = request.GET.get('student_id') # To verify ownership

        try:
            grievance = Grievance.objects.get(id=g_id)
            
            # 1. Security: Check if this grievance belongs to the requesting student
            if grievance.student.student_id != student_id:
                return Response({'status': 'error', 'message': 'Unauthorized'}, status=403)

            # 2. Time Check: Calculate difference in seconds
            time_diff = timezone.now() - grievance.created_at
            if time_diff.total_seconds() > 300: # 300 seconds = 5 Minutes
                return Response({'status': 'error', 'message': 'Time limit exceeded. You can only delete within 5 minutes.'}, status=400)
            
            # 3. Delete
            grievance.delete()
            return Response({'status': 'success', 'message': 'Grievance deleted successfully'})
            
        except Grievance.DoesNotExist:
            return Response({'status': 'error', 'message': 'Grievance not found'}, status=404)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)

# ==========================
# 4. DASHBOARD STATS
# ==========================
@api_view(['GET'])
def dashboard_stats(request):
    total_students = StudentProfile.objects.count()
    total_authorities = AuthorityProfile.objects.count()
    total_grievances = Grievance.objects.count()
    resolved_count = Grievance.objects.filter(status='Resolved').count()
    
    resolve_rate = 0
    if total_grievances > 0:
        resolve_rate = int((resolved_count / total_grievances) * 100)

    return Response({
        'students': total_students,
        'authorities': total_authorities,
        'complaints': total_grievances,
        'rate': f"{resolve_rate}%"
    })

# ==========================
# 5. USER MANAGEMENT (Edit/Delete)
# ==========================

@api_view(['GET', 'DELETE', 'PUT'])
def manage_students(request):
    # GET: List all students
    if request.method == 'GET':
        students = StudentProfile.objects.all().order_by('student_id')
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)
    
    # PUT: Edit a student
    elif request.method == 'PUT':
        data = request.data
        try:
            student = StudentProfile.objects.get(student_id=data['id'])
            user = student.user
            
            # Update User Table
            user.first_name = data.get('name', user.first_name)
            user.email = data.get('email', user.email)
            
            if data.get('password'): 
                user.set_password(data['password'])
            user.save()

            # Update Student Profile
            student.year = data.get('year', student.year)
            student.branch = data.get('branch', student.branch)
            student.gender = data.get('gender', student.gender)
            student.save()
            
            return Response({'status': 'success', 'message': 'Student Updated Successfully'})
        except StudentProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'Student not found'}, status=404)

    # DELETE: Remove a student
    elif request.method == 'DELETE':
        s_id = request.GET.get('id')
        try:
            student = StudentProfile.objects.get(student_id=s_id)
            user = student.user
            student.delete() 
            user.delete()    
            return Response({'status': 'success', 'message': f'Student {s_id} deleted'})
        except StudentProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'Student not found'}, status=404)


@api_view(['GET', 'DELETE', 'PUT'])
@parser_classes([MultiPartParser, FormParser]) # <--- CRITICAL FIX FOR PHOTOS
def manage_authorities(request):
    # GET: List all authorities
    if request.method == 'GET':
        authorities = AuthorityProfile.objects.all().order_by('employee_id')
        serializer = AuthoritySerializer(authorities, many=True)
        return Response(serializer.data)

    # PUT: Edit an authority
    elif request.method == 'PUT':
        data = request.data
        try:
            auth = AuthorityProfile.objects.get(employee_id=data['id'])
            user = auth.user
            
            # 1. Update User Details
            user.first_name = data.get('name', user.first_name)
            user.email = data.get('email', user.email)
            
            new_pass = data.get('password')
            if new_pass and new_pass != 'undefined' and new_pass.strip() != '': 
                user.set_password(new_pass)
            
            # 2. Update Photo
            if 'image' in request.FILES:
                if hasattr(user, 'profile_pic'):
                    user.profile_pic = request.FILES['image']
                else:
                    print("Warning: profile_pic field missing in DB")
            
            user.save()

            # 3. Update Authority Profile
            auth.department = data.get('dept', auth.department)
            auth.designation = data.get('designation', auth.designation)
            auth.gender = data.get('gender', auth.gender)
            auth.save()
            
            return Response({'status': 'success', 'message': 'Authority Updated Successfully'})
        except AuthorityProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'Authority not found'}, status=404)
        except Exception as e:
            return Response({'status': 'error', 'message': str(e)}, status=500)

    # DELETE: Remove an authority
    elif request.method == 'DELETE':
        a_id = request.GET.get('id')
        try:
            auth = AuthorityProfile.objects.get(employee_id=a_id)
            user = auth.user
            auth.delete()
            user.delete()
            return Response({'status': 'success', 'message': 'Authority Deleted'})
        except AuthorityProfile.DoesNotExist:
            return Response({'status': 'error', 'message': 'Authority not found'}, status=404)