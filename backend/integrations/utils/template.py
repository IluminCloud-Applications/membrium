"""
Utilitários de template para substituição de variáveis e conversão de texto.

Todas as integrações (Brevo, Evolution, futuras) usam este módulo
para substituir as variáveis [[name]], [[email]], etc.
"""
import re
import logging

logger = logging.getLogger(__name__)

# Variáveis suportadas nos templates
SUPPORTED_VARIABLES = [
    'name', 'first_name', 'email', 'password',
    'link', 'fast_link', 'curso', 'unsubscribe_link',
]


def replace_template_variables(template: str, data: dict) -> str:
    """
    Substitui todas as variáveis [[var]] no template pelos valores de `data`.

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
        result = result.replace(f'[[{var}]]', str(value))

    return result


def text_to_html(text: str, data: dict) -> str:
    """
    Converte texto simples em HTML para envio de email.
    Substitui variáveis, converte links em <a> tags e quebras de linha em <br>.

    Args:
        text: Texto simples com variáveis [[var]]
        data: Dicionário com valores para substituição

    Returns:
        HTML formatado pronto para envio de email
    """
    if not text:
        return ""

    # Primeiro substitui as variáveis (exceto link, que vira <a>)
    result = text
    for key, value in data.items():
        if key in ('link', 'fast_link', 'unsubscribe_link'):
            result = result.replace(
                f'[[{key}]]',
                f'<a href="{value}">{value}</a>'
            )
        else:
            result = result.replace(f'[[{key}]]', str(value))

    # Converte URLs soltas em links clicáveis
    url_pattern = r'(?<!href=")(https?://\S+)(?!")'
    result = re.sub(
        url_pattern,
        lambda m: f'<a href="{m.group(0)}" target="_blank">{m.group(0)}</a>',
        result,
    )

    # Converte quebras de linha em <br>
    html_content = result.replace('\n', '<br>')

    return f"""<html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        {html_content}
    </body>
</html>"""
