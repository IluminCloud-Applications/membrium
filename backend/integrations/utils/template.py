"""
Utilitários de template para substituição de variáveis e conversão de texto.

Todas as integrações (Brevo, Evolution, futuras) usam este módulo
para substituir as variáveis [[name]], [[email]], etc.
"""
import re
import logging

from .url_helper import ensure_https, force_https_in_html

logger = logging.getLogger(__name__)

# Variáveis suportadas nos templates
SUPPORTED_VARIABLES = [
    'name', 'first_name', 'email', 'password',
    'link', 'fast_link', 'curso', 'unsubscribe_link',
    'recovery_link',
]
URL_VARIABLES = {'link', 'fast_link', 'unsubscribe_link', 'recovery_link'}


def replace_template_variables(template: str, data: dict) -> str:
    """
    Substitui todas as variáveis [[var]] no template pelos valores de `data`.
    Garante que variáveis de URL usem obrigatoriamente https://.

    Args:
        template: Texto com variáveis no formato [[nome_variavel]]
        data: Dicionário com os valores para substituição

    Returns:
        Texto com as variáveis substituídas
    """
    if not template:
        return ""

    result = template

    # Gera first_name automaticamente se não existir
    if 'name' in data and 'first_name' not in data:
        try:
            data['first_name'] = data['name'].split()[0]
        except (AttributeError, IndexError):
            data['first_name'] = data.get('name', '')

    # Substitui cada variável
    for var in SUPPORTED_VARIABLES:
        value = data.get(var, '')
        if var in URL_VARIABLES and value:
            value = ensure_https(value)
        result = result.replace(f'[[{var}]]', str(value))

    return result


def text_to_html(text: str, data: dict) -> str:
    """
    Converte texto simples em HTML para envio de email.
    Substitui variáveis, converte links em <a> tags e quebras de linha em <br>.
    Garante que todo e qualquer link utilize https://.

    Args:
        text: Texto simples com variáveis [[var]]
        data: Dicionário com valores para substituição

    Returns:
        HTML formatado pronto para envio de email com garantia de HTTPS
    """
    if not text:
        return ""

    # Primeiro substitui as variáveis (exceto link, que vira <a>)
    result = text
    for key, value in data.items():
        if key in URL_VARIABLES:
            https_val = ensure_https(value)
            result = result.replace(
                f'[[{key}]]',
                f'<a href="{https_val}">{https_val}</a>'
            )
        else:
            result = result.replace(f'[[{key}]]', str(value))

    # Converte URLs soltas em links clicáveis forçando HTTPS
    # (?<!href=") evita URLs já no atributo href
    # (?<!>) evita URLs que já são texto de um <a> tag
    # [^\s<>"] evita capturar tags HTML como parte da URL
    url_pattern = r'(?<!href=")(?<!>)(https?://[^\s<>"]+)(?!")'
    result = re.sub(
        url_pattern,
        lambda m: f'<a href="{ensure_https(m.group(0))}" target="_blank">{ensure_https(m.group(0))}</a>',
        result,
    )

    # Converte quebras de linha em <br>
    html_content = result.replace('\n', '<br>')

    # Força https em qualquer resquício de http://
    html_content = force_https_in_html(html_content)

    return f"""<html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        {html_content}
    </body>
</html>"""
