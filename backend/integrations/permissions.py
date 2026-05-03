from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allow access only to admin users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_admin


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow admin to edit/delete, all authenticated users can read.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_authenticated and hasattr(request.user, 'profile') and request.user.profile.is_admin


class IsAdminOrCreateOnly(permissions.BasePermission):
    """
    Allow admin full access, employees can only create.
    Employees cannot edit or delete.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Safe methods (GET, HEAD, OPTIONS) allowed for all authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Create (POST) allowed for all authenticated users
        if request.method == 'POST':
            return True
        
        # Edit, Delete only for admin
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            return hasattr(request.user, 'profile') and request.user.profile.is_admin
        
        return False


class IsAdminOrOwnRecordOnly(permissions.BasePermission):
    """
    Allow admin full access, employees can only view and delete their own records.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        is_admin = hasattr(user, 'profile') and user.profile.is_admin
        
        # Admin can do anything
        if is_admin:
            return True
        
        # Safe methods (GET, HEAD, OPTIONS) allowed for all
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Employees can't edit or delete
        return False


class IsAdminCanDeleteOnly(permissions.BasePermission):
    """
    Allow admin to delete records. Employees cannot delete.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        user = request.user
        is_admin = hasattr(user, 'profile') and user.profile.is_admin
        
        # Only admin can delete
        if request.method == 'DELETE':
            return is_admin
        
        # Other methods allowed
        return True
