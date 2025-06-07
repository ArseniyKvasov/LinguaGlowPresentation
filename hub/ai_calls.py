import hashlib
import re
import requests
from groq import Groq
from urllib.parse import quote_plus
from django.core.cache import cache
from django.http import JsonResponse
from api_endpoints import UNSPLASH_ACCESS_KEY, GROQ_ACCESS_KEY


def search_images(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        query = data.get('query', '').strip()
        if not query:
            print('Query is required')
            return JsonResponse({'error': 'Query is required'}, status=400)

        # Убираем лишние пробелы
        query = re.sub(r'\s+', ' ', query)

        page = int(request.POST.get('page', 1))
        query_hash = hashlib.md5(query.encode()).hexdigest()
        cache_key = f'unsplash_image_search_{query_hash}_{page}'

        # Проверяем кеш
        cached_data = cache.get(cache_key)
        if cached_data:
            print('come back from cache')
            return JsonResponse(cached_data)

        # Кодируем запрос
        encoded_query = quote_plus(query)

        # URL запроса к Unsplash API
        url = f"https://api.unsplash.com/search/photos"
        params = {
            "query": encoded_query,
            "page": page,
            "per_page": 20,  # Количество изображений на странице
            "client_id": UNSPLASH_ACCESS_KEY,
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            # Проверяем, есть ли результаты
            if "results" not in data:
                return JsonResponse({'error': 'Invalid response from Unsplash'}, status=500)

            # Формируем список иллюстраций
            images = [{'url': img['urls']['regular'], 'title': img.get('alt_description', '')} for img in data['results']]

            # Кешируем результаты
            cache.set(cache_key, {'images': images}, timeout=300)
            return JsonResponse({'images': images})

        except requests.exceptions.RequestException as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=500)
        except Exception as e:
            print(e)
            return JsonResponse({'error': f'Failed to process response: {str(e)}'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=405)


def generate_text(
        prompt: str,
        model: str = "llama3-70b-8192",
        max_tokens: int = 8192,
        temperature: float = 0.1,
        top_p: float = 0.9,
        stream: bool = False,
        image_data: str = None
) -> str:
    try:
        client = Groq(api_key=GROQ_ACCESS_KEY)

        # Initialize content as a list
        messages = [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt}  # Text content as first element
            ]
        }]

        # Add image if provided
        if image_data:
            # Ensure image_data is clean base64 without data: prefix
            if isinstance(image_data, str) and image_data.startswith('data:image/'):
                image_data = image_data.split(',')[1]

            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/jpeg;base64,{image_data}"  # Or detect actual image type
                }
            })

        completion = client.chat.completions.create(
            messages=messages,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )

        response = completion.choices[0].message.content
        print("Response: ", response)

        try:
            return extract_json_or_array_from_text(response)
        except json.JSONDecodeError as e:
            return f"Invalid JSON generated: {str(e)}\nResponse: {response}"

    except Exception as e:
        error_msg = f"API Error: {str(e)}"
        if hasattr(e, 'response'):
            error_msg += f"\nResponse: {e.response.text}"
        return error_msg




def clean_multiline_strings(text):
    """
    Ищет JSON-поля вида "key": "\nмногострочный\nтекст\n"
    и превращает их в "key": "многострочный текст"
    """
    def replacer(match):
        key = match.group(1)
        value = match.group(2)
        value = ' '.join(line.strip() for line in value.splitlines())
        return f'"{key}": "{value}"'

    # Удаляем переносы строк внутри значений JSON-строк
    return re.sub(r'"(\w+)":\s*"\s*(.*?)\s*"', replacer, text, flags=re.DOTALL)

def fix_bool_json(text):
    # Заменяем True/False, но только если они не в кавычках (чтобы не сломать строки)
    # \b — граница слова, чтобы не заменять внутри слов
    text = re.sub(r'\bTrue\b', 'true', text)
    text = re.sub(r'\bFalse\b', 'false', text)
    return text

import json
import re

def extract_json_or_array_from_text(text):
    # Шаг 1: Найдём все код-блоки ```json ... ``` и обычные ```...```
    code_blocks = re.findall(r"```json(.*?)```", text, re.DOTALL | re.IGNORECASE)
    code_blocks += re.findall(r"```(.*?)```", text, re.DOTALL | re.IGNORECASE)

    # Шаг 2: Пробуем извлечь JSON из блоков
    for block in code_blocks + [text]:
        result = extract_first_balanced_json_or_array(block)
        if result is not None:
            return result

    # Шаг 3: Если ничего не нашли — вернуть исходный текст
    return text

def extract_first_balanced_json_or_array(text):
    i = 0
    while i < len(text):
        if text[i] in ['{', '[']:
            stack = []
            start = i
            for j in range(i, len(text)):
                if text[j] in ['{', '[']:
                    stack.append(text[j])
                elif text[j] in ['}', ']']:
                    if not stack:
                        break
                    open_char = stack.pop()
                    if (open_char == '{' and text[j] != '}') or (open_char == '[' and text[j] != ']'):
                        break
                    if not stack:
                        candidate = text[start:j+1]
                        candidate = clean_multiline_strings(candidate.strip())
                        candidate = fix_bool_json(candidate)
                        try:
                            return json.loads(candidate)
                        except json.JSONDecodeError:
                            break
            i = j + 1
        else:
            i += 1
    return None
