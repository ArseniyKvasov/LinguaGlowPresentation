from django.shortcuts import render, redirect
from django.contrib.auth import login, authenticate
from .forms import RegistrationForm, LoginForm
from django.contrib.auth import logout
from django.utils.http import url_has_allowed_host_and_scheme
from django.contrib.auth.decorators import login_required

@login_required
def dashboard(request):
    return render(request, "dashboard.html")

def handle_redirect(request, default='home'):
    """
    Обрабатывает параметр `next` и выполняет перенаправление.
    Защищено от открытых редиректов.
    """
    next_url = request.POST.get('next', request.GET.get('next', ''))
    if next_url and url_has_allowed_host_and_scheme(
        url=next_url,
        allowed_hosts={request.get_host()},  # Разрешаем только текущий хост
        require_https=request.is_secure()
    ):
        return redirect(next_url)
    return redirect(default)

def login_view(request):
    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return handle_redirect(request, default='home')
    else:
        form = LoginForm()
    next_url = request.GET.get('next', '')
    return render(request, 'users/login.html', {'form': form, 'next': next_url})

def register_view(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save(commit=False)
            user.set_password(form.cleaned_data['password1'])
            user.save()
            login(request, user)
            return handle_redirect(request, default='home')
    else:
        form = RegistrationForm()
    next_url = request.GET.get('next', '')
    return render(request, 'users/register.html', {'form': form, 'next': next_url})

def logout_view(request):
    logout(request)
    return redirect('login')