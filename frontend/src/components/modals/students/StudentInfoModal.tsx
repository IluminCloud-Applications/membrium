import type { ReactNode } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Student } from "@/types/student";
import { formatBrazilianDate } from "@/utils/formatDate";
import { statusColors, statusLabels } from "@/types/student";

interface StudentInfoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: Student | null;
}

export function StudentInfoModal({ open, onOpenChange, student }: StudentInfoModalProps) {
    if (!student) return null;

    const extra = student.extra_data || {};
    const source = extra.source || "Não identificado";
    const paytData = extra.payt || {};
    const utms = paytData.utms || {};
    
    // Customer details (from direct customer object, payt nested customer, or fallback fields)
    const customer = extra.customer || paytData.customer || {};
    const customerDoc = customer.doc || extra.doc || customer.cpf || customer.cnpj;
    const customerUrl = customer.url;
    const customerCode = customer.code || paytData.customer_code || extra.customer_code;

    // Transaction details
    const transactionId = paytData.transaction_id || extra.transaction_id;
    const paymentMethod = paytData.payment_method || extra.payment_method;
    const sellerId = paytData.seller_id;
    const chatwootContact = extra.chatwoot_contact_id;
    const chatwootConv = extra.chatwoot_conversation_id;

    // Filter out common keys for the additional data section
    const knownKeys = ["source", "full_name", "payt", "customer", "chatwoot_contact_id", "chatwoot_conversation_id", "transaction_id", "payment_method", "customer_code", "doc"];
    const otherKeys = Object.keys(extra).filter(key => !knownKeys.includes(key));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 gap-3">
                <DialogHeader className="pb-2 border-b">
                    <DialogTitle className="flex items-center gap-1.5 text-base font-bold">
                        <i className="ri-information-line text-primary text-lg" />
                        Ficha do Aluno
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 text-xs">
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
                                label="Origem" 
                                value={
                                    <span className="capitalize font-semibold text-primary">
                                        {source}
                                    </span>
                                } 
                            />
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
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Parâmetros de Campanha (UTM)</h4>
                            <div className="grid grid-cols-2 gap-1 bg-muted/10 p-2 rounded-lg border">
                                {Object.entries(utms).map(([key, val]) => {
                                    if (!val) return null;
                                    return (
                                        <div key={key} className="flex justify-between items-center py-0.5 border-b border-dashed border-muted last:border-0">
                                            <span className="text-muted-foreground text-[10px] uppercase font-mono">{key}:</span>
                                            <span className="font-semibold text-foreground truncate max-w-[120px]" title={String(val)}>
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
                        <div className="space-y-1.5">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Integrações de Chat</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-muted/10 p-2.5 rounded-lg border">
                                {chatwootContact && <DataRow label="Chatwoot Contato" value={chatwootContact} isMono />}
                                {chatwootConv && <DataRow label="Chatwoot Conversa" value={chatwootConv} isMono />}
                            </div>
                        </div>
                    )}

                    {/* Dados Adicionais Raw JSON */}
                    {otherKeys.length > 0 && (
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Outros Metadados</h4>
                            <pre className="text-[10px] font-mono bg-muted/40 p-2 rounded border overflow-x-auto max-h-[100px] leading-tight">
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
        <div className="flex justify-between items-center py-0.5 border-b border-dashed border-muted last:border-0 min-w-0">
            <span className="text-muted-foreground shrink-0 pr-2">{label}:</span>
            <span className={`font-medium text-foreground truncate max-w-[200px] ${isMono ? "font-mono text-[11px]" : ""} ${className}`} title={typeof value === 'string' ? value : undefined}>
                {renderValue(value)}
            </span>
        </div>
    );
}
