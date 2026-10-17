import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Student, CourseSourceInfo, PurchaseHistoryEntry } from "@/types/student";
import { formatBrazilianDate, formatBrazilianDateTime } from "@/utils/formatDate";
import { statusColors, statusLabels, getStudentSources } from "@/types/student";
import { PlatformBadge } from "@/components/students/StudentTable";
import { studentsService, type StudentActivity } from "@/services/students";

interface StudentInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    principal: "Principal",
    order_bump: "Order Bump",
    upsell: "Upsell",
    bonus: "Bônus",
};

export function StudentInfoModal({ open, onOpenChange, student }: StudentInfoModalProps) {
    if (!student) return null;

    const [activities, setActivities] = useState<StudentActivity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);

    useEffect(() => {
        if (!open || !student?.id) {
            setActivities([]);
            return;
        }

        let isMounted = true;
        setLoadingActivities(true);

        studentsService.getActivities(student.id, 50)
            .then(res => {
                if (isMounted) {
                    setActivities(res.activities || []);
                }
            })
            .catch(err => {
                console.error("Erro ao buscar atividades do aluno:", err);
                if (isMounted) setActivities([]);
            })
            .finally(() => {
                if (isMounted) setLoadingActivities(false);
            });

        return () => {
            isMounted = false;
        };
    }, [open, student?.id]);

    const extra = student.extra_data || {};
    const source = extra.source || "Não identificado";
    const allSources = getStudentSources(extra);
    const paytData = extra.payt || {};
    const utms = extra.utms || paytData.utms || extra.lastlink?.utms || extra.hubla?.utms || {};
    
    // Customer details (from direct customer object, payt nested customer, or fallback fields)
    const customer = extra.customer || paytData.customer || {};
    const customerDoc = customer.doc || extra.doc || extra.document || customer.Document || customer.cpf || customer.cnpj;
    const customerUrl = customer.url;
    const customerCode = customer.code || paytData.customer_code || extra.customer_code || customer.Id;

    // Transaction details
    const transactionId = paytData.transaction_id || extra.transaction_id;
    const paymentMethod = paytData.payment_method || extra.payment_method;
    const sellerId = paytData.seller_id || extra.seller_id;
    const chatwootContact = extra.chatwoot_contact_id;
    const chatwootConv = extra.chatwoot_conversation_id;

    // Per-course sources & chronological purchase history (with safe fallback for legacy students in production)
    const rawCourseSources: Record<string, CourseSourceInfo> =
        extra.course_sources && typeof extra.course_sources === "object" ? extra.course_sources : {};
    const rawPurchaseHistory: PurchaseHistoryEntry[] =
        Array.isArray(extra.purchase_history) ? extra.purchase_history : [];

    // Build unified product list: all active enrolled courses + any removed courses recorded in course_sources
    const enrolledCourseIds = new Set(student.courses.map(c => c.id));
    const productItems: (CourseSourceInfo & { isLegacyFallback?: boolean })[] = student.courses.map((c) => {
        const mapped = rawCourseSources[String(c.id)];
        if (mapped && typeof mapped === "object") {
            return {
                ...mapped,
                course_id: c.id,
                course_name: c.name,
                status: "active",
            };
        }
        return {
            course_id: c.id,
            course_name: c.name,
            source: extra.source || "",
            status: "active",
            granted_at: student.createdAt || null,
            isLegacyFallback: true,
        };
    });

    Object.values(rawCourseSources).forEach((cs) => {
        if (cs && typeof cs === "object" && cs.course_id && !enrolledCourseIds.has(Number(cs.course_id))) {
            productItems.push({
                ...cs,
                status: cs.status || "removed",
            });
        }
    });

    const chronologicalHistory = [...rawPurchaseHistory].reverse();

    // Filter out common keys for the additional data section
    const knownKeys = [
        "source", "sources", "first_source", "course_sources", "purchase_history",
        "last_access_at", "full_name", "payt", "customer", "chatwoot_contact_id",
        "chatwoot_conversation_id", "transaction_id", "payment_method", "customer_code",
        "doc", "document", "seller_id", "utms", "lastlink", "hubla", "product_name",
        "offer_name", "price"
    ];
    const otherKeys = Object.keys(extra).filter(key => !knownKeys.includes(key));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg w-full max-h-[85vh] overflow-y-auto overflow-x-hidden p-4 gap-3">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="flex items-center gap-1.5 text-base font-bold">
                        <i className="ri-information-line text-primary text-lg" />
                        Ficha do Aluno
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-xs min-w-0 w-full">
                    {/* Aluno Header */}
                    <div className="flex items-center justify-between bg-muted/30 p-2.5 rounded-lg border">
                        <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate text-foreground">{student.name}</h3>
                            <p className="text-muted-foreground text-xs truncate">{student.email}</p>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] py-0 px-1.5 font-medium ${statusColors[student.status]}`}>
                            {statusLabels[student.status]}
                        </Badge>
                    </div>

                    {/* Dados Pessoais / Cadastro */}
                    <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Dados Pessoais & Contato</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-muted/10 p-2.5 rounded-lg border">
                            <DataRow label="Telefone" value={student.phone || customer.phone || "Não informado"} />
                            <DataRow label="CPF/CNPJ" value={customerDoc || "Não informado"} />
                            <DataRow label="Cadastro" value={formatBrazilianDate(student.createdAt)} />
                            <DataRow 
                                label={allSources.length > 1 ? "Plataformas" : "Origem"} 
                                value={
                                    allSources.length > 0 ? (
                                        <span className="inline-flex items-center gap-1 flex-wrap justify-end">
                                            {allSources.map((src) => (
                                                <PlatformBadge key={src} source={src} compact />
                                            ))}
                                        </span>
                                    ) : (
                                        <span className="capitalize font-semibold text-primary">
                                            {source}
                                        </span>
                                    )
                                } 
                            />
                            <div className="col-span-2 pt-1 border-t border-dashed border-border/60">
                                <DataRow 
                                    label="Último Acesso" 
                                    value={
                                        (student.lastAccessAt || extra.last_access_at) ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                                <i className="ri-login-circle-line text-xs" />
                                                {formatBrazilianDateTime(student.lastAccessAt || extra.last_access_at)}
                                            </span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400 italic inline-flex items-center gap-1 font-medium">
                                                <i className="ri-error-warning-line text-xs" />
                                                Nunca acessou a plataforma
                                            </span>
                                        )
                                    } 
                                />
                            </div>
                            <div className="col-span-2 pt-1 border-t border-dashed border-border/60">
                                <DataRow 
                                    label="Status do E-mail" 
                                    value={
                                        (student.emailOpenedAt || student.emailStatus === "opened") ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <i className="ri-mail-check-line text-xs" />
                                                    E-mail aberto
                                                </span>
                                                {student.emailOpenedAt && (
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        ({formatBrazilianDateTime(student.emailOpenedAt)})
                                                    </span>
                                                )}
                                            </span>
                                        ) : student.emailStatus === "fallback_sent" ? (
                                            <span className="text-orange-600 dark:text-orange-400 font-medium inline-flex items-center gap-1.5">
                                                <i className="ri-mail-forbid-line text-xs" />
                                                Não abriu (aviso de SPAM e suporte enviado)
                                            </span>
                                        ) : student.emailStatus === "pending" ? (
                                            <span className="text-amber-600 dark:text-amber-400 font-medium inline-flex items-center gap-1.5 flex-wrap">
                                                <span className="inline-flex items-center gap-1">
                                                    <i className="ri-mail-unread-line text-xs" />
                                                    Não abriu ainda {student.emailStage === 2 ? "(2º envio feito)" : "(1º envio pendente)"}
                                                </span>
                                                {student.emailLastSentAt && (
                                                    <span className="text-[10px] text-muted-foreground font-normal">
                                                        ({formatBrazilianDateTime(student.emailLastSentAt)})
                                                    </span>
                                                )}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic inline-flex items-center gap-1.5 font-normal">
                                                <i className="ri-mail-line text-xs" />
                                                Nenhum disparo registrado
                                            </span>
                                        )
                                    } 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Produtos & Origem por Plataforma */}
                    <div className="space-y-1.5 min-w-0 w-full">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <i className="ri-shopping-bag-3-line text-xs text-primary" />
                                Produtos & Origem por Plataforma
                                {productItems.length > 0 && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                        {productItems.length}
                                    </span>
                                )}
                            </h4>
                            {allSources.length > 1 && (
                                <span className="text-[10px] text-primary font-semibold flex items-center gap-1">
                                    <i className="ri-exchange-box-line text-[11px]" />
                                    Múltiplas plataformas ({allSources.length})
                                </span>
                            )}
                        </div>

                        <div className="bg-muted/10 p-2.5 rounded-lg border space-y-2">
                            {productItems.length === 0 ? (
                                <div className="py-3 text-center text-muted-foreground text-xs">
                                    Nenhum produto/curso vinculado a este aluno.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[210px] overflow-y-auto pr-0.5">
                                    {productItems.map((item) => {
                                        const isRemoved = item.status === "removed";
                                        const catLabel = item.category ? (CATEGORY_LABELS[item.category] || item.category) : null;
                                        return (
                                            <div
                                                key={`${item.course_id}-${item.status}`}
                                                className={`p-2 rounded-md border text-[11px] space-y-1.5 ${
                                                    isRemoved
                                                        ? "bg-red-500/5 border-red-500/20 opacity-80"
                                                        : "bg-background/80 border-border/70"
                                                }`}
                                            >
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <i className={`ri-book-open-line text-xs shrink-0 ${isRemoved ? "text-red-500" : "text-primary"}`} />
                                                        <span className={`font-semibold truncate ${isRemoved ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                                            {item.course_name}
                                                        </span>
                                                        {catLabel && (
                                                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 font-normal text-muted-foreground">
                                                                {catLabel}
                                                            </Badge>
                                                        )}
                                                        {isRemoved && (
                                                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 bg-red-500/10 text-red-500">
                                                                Removido
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <PlatformBadge source={item.source || undefined} compact />
                                                </div>

                                                <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-muted-foreground pt-1 border-t border-dashed border-border/50">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {item.combo_name && (
                                                            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-medium">
                                                                Combo: {item.combo_name}
                                                            </span>
                                                        )}
                                                        {item.is_bonus && item.unlocked_by && (
                                                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-medium">
                                                                Bônus via {item.unlocked_by}
                                                            </span>
                                                        )}
                                                        {item.product_name && item.product_name !== item.course_name && (
                                                            <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-medium text-foreground/80 truncate max-w-[170px]" title={item.product_name}>
                                                                Checkout: {item.product_name}
                                                            </span>
                                                        )}
                                                        {item.payment_method && (
                                                            <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] uppercase font-mono text-foreground/80">
                                                                {item.payment_method}
                                                            </span>
                                                        )}
                                                        {item.transaction_id && (
                                                            <span className="font-mono text-[9px] text-muted-foreground truncate max-w-[140px]" title={item.transaction_id}>
                                                                ID: {item.transaction_id}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-auto">
                                                        {isRemoved && item.removed_at
                                                            ? `Removido em ${formatBrazilianDateTime(item.removed_at)}`
                                                            : item.granted_at
                                                            ? formatBrazilianDateTime(item.granted_at)
                                                            : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Linha do Tempo de Compras / Movimentações entre Plataformas */}
                            {chronologicalHistory.length > 0 && (
                                <div className="pt-2 border-t border-dashed border-border/70 space-y-1.5">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                        <i className="ri-git-commit-line text-xs text-primary" />
                                        Histórico de Movimentações ({chronologicalHistory.length})
                                    </p>
                                    <div className="relative pl-3 space-y-2 max-h-[160px] overflow-y-auto before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-[1.5px] before:bg-border/60">
                                        {chronologicalHistory.map((hist, idx) => {
                                            const isAdd = hist.action !== "remove";
                                            const coursesText =
                                                hist.courses && hist.courses.length > 0
                                                    ? hist.courses.map(c => c.name).join(", ")
                                                    : hist.course_name || "Curso";
                                            return (
                                                <div key={`${hist.timestamp || idx}-${idx}`} className="relative flex items-start gap-2 min-w-0">
                                                    <div
                                                        className={`-ml-[17px] shrink-0 w-4 h-4 mt-0.5 rounded-full flex items-center justify-center border text-[9px] ${
                                                            isAdd
                                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                                                : "bg-red-500/10 text-red-500 border-red-500/30"
                                                        }`}
                                                    >
                                                        <i className={isAdd ? "ri-add-line" : "ri-subtract-line"} />
                                                    </div>
                                                    <div className="min-w-0 flex-1 bg-background/60 p-1.5 rounded border border-border/60 text-[10px] space-y-0.5">
                                                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                                            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                                                                <span className={`font-semibold ${isAdd ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                                                                    {isAdd ? "Liberado" : "Removido"}
                                                                </span>
                                                                <PlatformBadge source={hist.source} compact />
                                                            </div>
                                                            {hist.timestamp && (
                                                                <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                                                    {formatBrazilianDateTime(hist.timestamp)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-foreground font-medium truncate" title={coursesText}>
                                                            {hist.combo_name ? `Combo ${hist.combo_name}: ${coursesText}` : coursesText}
                                                        </div>
                                                        {(hist.bonus_courses && hist.bonus_courses.length > 0) && (
                                                            <div className="text-[9px] text-muted-foreground truncate">
                                                                + Bônus: {hist.bonus_courses.join(", ")}
                                                            </div>
                                                        )}
                                                        {(hist.transaction_id || hist.payment_method) && (
                                                            <div className="flex items-center gap-2 text-[9px] text-muted-foreground font-mono pt-0.5">
                                                                {hist.payment_method && <span className="uppercase">{hist.payment_method}</span>}
                                                                {hist.transaction_id && <span className="truncate">ID: {hist.transaction_id}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Histórico de Acessos & Aulas */}
                    <div className="space-y-1.5 min-w-0 w-full">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <i className="ri-history-line text-xs text-primary" />
                                Histórico de Acessos & Aulas
                                {activities.length > 0 && (
                                    <span className="bg-primary/10 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                                        {activities.length}
                                    </span>
                                )}
                            </h4>
                            {activities.length > 0 && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                    <i className="ri-checkbox-circle-fill text-[11px]" />
                                    Acessos Comprovados
                                </span>
                            )}
                        </div>

                        <div className="bg-muted/10 p-2.5 rounded-lg border max-h-[190px] overflow-y-auto space-y-2">
                            {loadingActivities ? (
                                <div className="py-4 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
                                    <i className="ri-loader-4-line animate-spin text-sm" />
                                    Carregando histórico de acessos...
                                </div>
                            ) : activities.length === 0 ? (
                                <div className="py-4 text-center text-muted-foreground text-xs space-y-1">
                                    <i className="ri-file-search-line text-lg opacity-40 block mx-auto" />
                                    <p className="font-semibold text-foreground/80">Nenhuma atividade registrada ainda</p>
                                    <p className="text-[10px] opacity-70">O aluno ainda não realizou login ou visualizou aulas.</p>
                                </div>
                            ) : (
                                <div className="relative pl-3 space-y-2.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-border/60">
                                    {activities.map((act) => (
                                        <div key={act.id} className="relative flex items-start gap-2 min-w-0">
                                            {/* Dot / Icon */}
                                            <div className={`-ml-[17px] shrink-0 w-5 h-5 rounded-full flex items-center justify-center border text-[11px] shadow-xs ${act.color || 'bg-background text-foreground'}`}>
                                                <i className={act.icon || 'ri-circle-fill'} />
                                            </div>

                                            {/* Content */}
                                            <div className="min-w-0 flex-1 bg-background/70 p-2 rounded-md border text-[11px] space-y-1">
                                                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                                    <span className="font-semibold text-foreground truncate">
                                                        {act.description}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {formatBrazilianDateTime(act.created_at)}
                                                    </span>
                                                </div>

                                                {(act.module_name || act.user_agent || act.ip_address) && (
                                                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground pt-1 border-t border-dashed border-border/50">
                                                        {act.module_name && (
                                                            <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-medium text-foreground/80 truncate max-w-[150px]" title={act.module_name}>
                                                                Módulo: {act.module_name}
                                                            </span>
                                                        )}
                                                        {act.user_agent && (
                                                            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                                                                <i className="ri-device-line text-[9px]" />
                                                                {act.user_agent}
                                                            </span>
                                                        )}
                                                        {act.ip_address && (
                                                            <span className="inline-flex items-center gap-0.5 text-muted-foreground font-mono text-[9px]">
                                                                IP: {act.ip_address}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Dados de Venda / Checkout */}
                    {(transactionId || customerCode || sellerId || paymentMethod || customerUrl) && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Informações da Venda</h4>
                                {customerUrl && (
                                    <a 
                                        href={customerUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                    >
                                        Ver na plataforma <i className="ri-external-link-line text-[9px]" />
                                    </a>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-y-1.5 bg-muted/10 p-2.5 rounded-lg border">
                                {transactionId && <DataRow label="ID Transação" value={transactionId} isMono />}
                                {customerCode && <DataRow label="Cód. Cliente" value={customerCode} isMono />}
                                {sellerId && <DataRow label="ID Seller" value={sellerId} isMono />}
                                {paymentMethod && <DataRow label="Método Pgto" value={paymentMethod} className="capitalize" />}
                            </div>
                        </div>
                    )}

                    {/* UTMs */}
                    {Object.values(utms).some(val => val) && (
                        <div className="space-y-1.5 min-w-0 w-full">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parâmetros de Campanha (UTM)</h4>
                            <div className="grid grid-cols-2 gap-1 bg-muted/10 p-2 rounded-lg border min-w-0">
                                {Object.entries(utms).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <div key={key} className="flex justify-between items-center py-0.5 border-b border-dashed border-muted last:border-0 min-w-0 gap-1.5">
                                            <span className="text-muted-foreground text-[10px] uppercase font-mono shrink-0">{key}:</span>
                                            <span className="font-semibold text-foreground truncate min-w-0 text-right" title={String(val)}>
                                                {renderValue(val)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Integrações */}
                    {(chatwootContact || chatwootConv) && (
                        <div className="space-y-1.5 min-w-0 w-full">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Integrações de Chat</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-muted/10 p-2.5 rounded-lg border min-w-0">
                                {chatwootContact && <DataRow label="Chatwoot Contato" value={chatwootContact} isMono />}
                                {chatwootConv && <DataRow label="Chatwoot Conversa" value={chatwootConv} isMono />}
                            </div>
                        </div>
                    )}

                    {/* Dados Adicionais Raw JSON */}
                    {otherKeys.length > 0 && (
                        <div className="space-y-1 min-w-0 w-full">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outros Metadados</h4>
                            <pre className="text-[10px] font-mono bg-muted/40 p-2.5 rounded-lg border overflow-x-auto overflow-y-auto max-h-[140px] max-w-full leading-relaxed whitespace-pre-wrap break-all select-text">
                                {JSON.stringify(
                                    otherKeys.reduce((acc, key) => ({ ...acc, [key]: extra[key] }), {}),
                                    null,
                                    2
                                )}
                            </pre>
                        </div>
                    )}

                    {/* Close Action */}
                    <div className="flex justify-end pt-1">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-8 text-xs">
                            Fechar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function renderValue(val: any): ReactNode {
    if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
        return (
            <a 
                href={val} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline inline-flex items-center gap-0.5 font-semibold"
                title={val}
            >
                Link <i className="ri-external-link-line text-[10px]" />
            </a>
        );
    }
    return val;
}

interface DataRowProps {
    label: string;
    value: ReactNode;
    isMono?: boolean;
    className?: string;
}

function DataRow({ label, value, isMono = false, className = "" }: DataRowProps) {
    return (
        <div className="flex justify-between items-center py-0.5 border-b border-dashed border-muted last:border-0 min-w-0 gap-2">
            <span className="text-muted-foreground shrink-0">{label}:</span>
            <span className={`font-medium text-foreground truncate min-w-0 text-right ${isMono ? "font-mono text-[11px]" : ""} ${className}`} title={typeof value === 'string' ? value : undefined}>
                {renderValue(value)}
            </span>
        </div>
    );
}
