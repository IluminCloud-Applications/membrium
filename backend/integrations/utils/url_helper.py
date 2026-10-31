"""
Utilitários para tratamento de URLs e garantia de protocolo HTTPS.

Em disparos de email e notificações, TODOS os links DEVEM SEMPRE utilizar https://.
Este módulo centraliza as regras de garantia de HTTPS em links, textos e templates HTML.
"""
import re


def ensure_https(url: str | None) -> str:
    """
    Garante que uma URL ou domínio utilize o protocolo https://.

    - 'http://exemplo.com' -> 'https://exemplo.com'
    - 'exemplo.com' -> 'https://exemplo.com'
    - 'https://exemplo.com' -> 'https://exemplo.com'
    - Caminhos relativos como '/login' são mantidos ou tratados conforme contexto.
    """
    if not url:
        return ""

    url_str = str(url).strip()
    if not url_str:
        return ""

    if url_str.startswith("http://"):
        return "https://" + url_str[7:]

    if url_str.startswith("https://"):
        return url_str

    if url_str.startswith("//"):
        return "https:" + url_str

    # Se não começar com / (não for caminho relativo puro), adiciona https://
    if not url_str.startswith("/"):
        return f"https://{url_str}"

    return url_str


def force_https_in_html(html_content: str | None) -> str:
    """
    Substitui qualquer ocorrência de http:// por https:// dentro de um documento ou fragmento HTML.
    Garante que hrefs, src e URLs no corpo do email sempre usem https://.
    """
    if not html_content:
        return ""

    # Substitui qualquer http:// por https://
    return re.sub(r'http://', 'https://', str(html_content))


def sanitize_notification_urls(student_data: dict) -> dict:
    """
    Garante que todos os campos de URL em student_data usem obrigatoriamente https://.
    """
    if not isinstance(student_data, dict):
        return student_data

    url_keys = [
        'link', 'fast_link', 'unsubscribe_link',
        'recovery_link', 'base_url', 'tracking_pixel_url'
    ]

    for key in url_keys:
        val = student_data.get(key)
        if val and isinstance(val, str):
            student_data[key] = ensure_https(val)

    return student_data
