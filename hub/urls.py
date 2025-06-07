from django.urls import path
from . import views, ai_calls

urlpatterns = [
    path('', views.home_view, name='home'),
    path('create-course/', views.create_course, name='create_course'),
    path('course/<uuid:course_id>/delete/', views.delete_course, name='delete_course'),
    path('course/<uuid:course_id>/lessons/', views.lesson_list_view, name='lesson_list'),
    path('course/<uuid:course_id>/lessons/add/', views.add_lesson, name='add_lesson'),
    path('lesson/<uuid:lesson_id>/', views.lesson_page_view, name='lesson_page'),
    path('lesson/<uuid:lesson_id>/delete/', views.delete_lesson, name='delete_lesson'),
    path('lesson/<uuid:lesson_id>/add_section/', views.add_section, name='add_section'),
    path('section/<uuid:section_id>/update', views.update_section, name='update_section'),
    path('section/<uuid:section_id>/delete/', views.delete_section_view, name='delete_section'),
    path('section/<uuid:section_id>/task/save', views.taskSave, name='save_task'),
    path('api/tasks/<uuid:task_id>/', views.get_task_data, name='get_task_data'),
    path('api/section/<uuid:section_id>', views.get_section_tasks, name='get_section_tasks'),
    path('tasks/<uuid:task_id>/delete/', views.delete_task, name='delete_task'),

    path('classroom/<uuid:classroom_id>/', views.classroom_view, name='classroom_view'),
    path("choose-classroom/<uuid:lesson_id>/", views.choose_classroom, name="choose_classroom"),
    path("create-classroom/<uuid:lesson_id>/", views.create_classroom, name="create_classroom"),
    path('classrooms/<uuid:classroom_id>/delete/', views.delete_classroom, name='delete_classroom'),
    path('classroom/<uuid:classroom_id>/toggle-copying/', views.toggle_copying, name='toggle_copying'),


    path("invite/<uuid:classroom_id>/", views.create_invitation, name="create_invitation"),
    path("invitation/<str:code>/", views.accept_invitation, name="accept_invitation"),

    path('search-images/', ai_calls.search_images, name='search_images'),

    path('api/receive-answer/', views.receiveAnswer, name='receive_answer'),

    path('add-context-element/<uuid:lesson_id>/', views.addContextElement, name='add_context_element'),
    path('remove-context-element/<uuid:lesson_id>/<str:task_id>/', views.removeTaskFromContext, name='remove_task_from_context'),
    path('context/<uuid:lesson_id>/get/', views.getContext, name='get_context'),

    path('generate-request/', views.generateRequest, name='generate_request'),
    path('upload-image/', views.upload_image, name='upload_image'),
    path('upload-audio/', views.upload_audio, name='upload_audio'),

    path("api/reorder-tasks/", views.reorder_tasks, name="reorder_tasks"),
    path('api/get_answers/', views.getAnswers, name='get_answers'),
    path("api/delete_answers/", views.delete_answers, name="delete_answers"),
    path('api/edge-tts/', views.edge_tts_view, name='edge_tts'),
]

