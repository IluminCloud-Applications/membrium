"""
ChatbotAI — Chatbot educacional com RAG baseado em transcrições.

Usa Langchain para:
- Busca de transcrições relevantes no banco
- Geração de respostas com contexto das transcrições
- Suporte a histórico de conversa
- Toggle de conhecimento interno
"""

import logging
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser

from ai.core.config import get_llm
from ai.core.prompts import CHATBOT_WITH_TRANSCRIPTS, CHATBOT_INTERNAL_KNOWLEDGE

logger = logging.getLogger("ai.models.chatbot")

# Gerenciar histórico de conversas em memória (por student_id)
_conversation_histories: dict[int, list] = {}
MAX_HISTORY_MESSAGES = 15

# Frases casuais que não precisam buscar transcrições
CASUAL_PHRASES = [
    "bom dia", "boa tarde", "boa noite", "olá", "oi", "tudo bem",
    "como vai", "como está", "obrigado", "obrigada", "valeu",
    "tchau", "até logo", "quem é você", "qual seu nome",
    "como funciona", "o que você faz", "como te chamo",
]


class ChatbotAI:
    """Classe que encapsula toda a lógica do chatbot educacional."""

    @staticmethod
    def is_casual_message(message: str) -> bool:
        """Verifica se a mensagem é casual (saudação) ou acadêmica."""
        msg_lower = message.lower().strip()
        if len(msg_lower.split()) < 3:
            return True
        return any(msg_lower.startswith(phrase) or msg_lower == phrase for phrase in CASUAL_PHRASES)

    @staticmethod
    def get_history(student_id: int) -> list:
        """Retorna o histórico de conversa de um aluno."""
        return _conversation_histories.get(student_id, [])

    @staticmethod
    def clear_history(student_id: int):
        """Limpa o histórico de conversa de um aluno."""
        _conversation_histories.pop(student_id, None)

    @staticmethod
    def _build_langchain_history(raw_history: list) -> list:
        """Converte histórico bruto em mensagens Langchain."""
        messages = []
        for msg in raw_history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        return messages

    @staticmethod
    def _append_to_history(student_id: int, role: str, content: str):
        """Adiciona mensagem ao histórico e limita o tamanho."""
        if student_id not in _conversation_histories:
            _conversation_histories[student_id] = []
        _conversation_histories[student_id].append({"role": role, "content": content})
        # Limitar histórico
        if len(_conversation_histories[student_id]) > MAX_HISTORY_MESSAGES:
            _conversation_histories[student_id] = _conversation_histories[student_id][-MAX_HISTORY_MESSAGES:]

    @staticmethod
    def generate_response(
        question: str,
        student_id: int,
        provider: str,
        api_key: str,
        model: str,
        use_internal_knowledge: bool,
        relevant_transcripts: list | None = None,
        base_url: str = "",
        additional_instructions: str = "",
        client_history: list | None = None,
    ) -> str:
        """
        Gera resposta do chatbot.
        
        Args:
            question: Pergunta do aluno
            student_id: ID do aluno para gerenciamento de histórico
            provider: 'gemini' ou 'openai'
            api_key: Chave API do provider
            model: Nome do modelo
            use_internal_knowledge: Se permite usar conhecimento próprio
            relevant_transcripts: Lista de objetos LessonTranscript relevantes
            base_url: URL base para gerar links das aulas
        
        Returns:
            Texto da resposta do chatbot
        """
        try:
            llm = get_llm(provider, api_key, model)
            parser = StrOutputParser()
            
            is_casual = ChatbotAI.is_casual_message(question)
            has_transcripts = relevant_transcripts and len(relevant_transcripts) > 0
            
            # Adicionar pergunta ao histórico in-memory (para Chatwoot sync)
            ChatbotAI._append_to_history(student_id, "user", question)

            # Usar histórico do frontend se disponível, senão usa in-memory
            if client_history:
                history = ChatbotAI._build_langchain_history(client_history)
            else:
                history = ChatbotAI._build_langchain_history(
                    ChatbotAI.get_history(student_id)[:-1]
                )
            
            # Formatar instruções adicionais para o prompt
            extra = (
                f"\n\nINSTRUÇÕES ADICIONAIS DO ADMINISTRADOR:\n{additional_instructions.strip()}"
                if additional_instructions and additional_instructions.strip()
                else ""
            )

            # Decidir qual prompt usar
            if is_casual and use_internal_knowledge:
                # Conversa casual com conhecimento interno
                response = ChatbotAI._respond_with_internal_knowledge(
                    llm, parser, question, history, extra
                )
            elif has_transcripts:
                # Resposta com base nas transcrições
                response = ChatbotAI._respond_with_transcripts(
                    llm, parser, question, history, relevant_transcripts, base_url, extra
                )
            elif use_internal_knowledge:
                # Sem transcrições mas com conhecimento interno
                response = ChatbotAI._respond_with_internal_knowledge(
                    llm, parser, question, history, extra
                )
            else:
                response = "Desculpe, não encontrei informações sobre isso nas aulas. Tente reformular a pergunta ou entre em contato com o suporte."
            
            # Adicionar resposta ao histórico
            ChatbotAI._append_to_history(student_id, "assistant", response)
            return response
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta do chatbot: {str(e)}")
            return "Desculpe, estou enfrentando problemas para responder. Por favor, tente novamente mais tarde."

    @staticmethod
    def _respond_with_transcripts(
        llm, parser, question: str, history: list,
        transcripts: list, base_url: str, additional_instructions: str = ""
    ) -> str:
        """Gera resposta usando transcrições como contexto (RAG)."""
        transcripts_text = ChatbotAI._format_transcripts(transcripts, base_url)
        
        chain = CHATBOT_WITH_TRANSCRIPTS | llm | parser
        return chain.invoke({
            "context_instructions": "Use as transcrições das aulas fornecidas para responder ao aluno.",
            "additional_instructions": additional_instructions,
            "history": history,
            "transcripts": transcripts_text,
            "question": question,
        })

    @staticmethod
    def _respond_with_internal_knowledge(
        llm, parser, question: str, history: list, additional_instructions: str = ""
    ) -> str:
        """Gera resposta usando o conhecimento interno da LLM."""
        chain = CHATBOT_INTERNAL_KNOWLEDGE | llm | parser
        return chain.invoke({
            "context_instructions": "Você pode usar seu conhecimento interno para responder ao aluno.",
            "additional_instructions": additional_instructions,
            "history": history,
            "question": question,
        })

    @staticmethod
    def _format_transcripts(transcripts: list, base_url: str) -> str:
        """Formata transcrições para inserção no prompt."""
        parts = []
        for t in transcripts:
            lesson_url = f"{base_url}/course/{t.course_id}/module/{t.module_id}/lesson/{t.lesson_id}"
            parts.append(
                f"AULA: {t.lesson_title}\n"
                f"MÓDULO: {t.module_name}\n"
                f"CURSO: {t.course_name}\n"
                f"URL: {lesson_url}\n"
                f"TRANSCRIÇÃO:\n{t.transcript_text[:1500]}\n"
            )
        return "\n---\n".join(parts)
