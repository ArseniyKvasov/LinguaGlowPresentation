import json
import base64
import re
import random

from django import template

register = template.Library()


@register.filter
def get_current_user(request):
    """Возвращает текущего пользователя (учителя) из запроса."""
    return request.user