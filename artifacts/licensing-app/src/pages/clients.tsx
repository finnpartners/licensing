import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/components/layout/AppLayout";
import { useListClients, useListLicenses, useListProducts } from "@workspace/api-client-react";
import { useClientMutations, useLicenseMutations } from "@/hooks/use-api-wrappers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit2, Trash2, Users, Key, Copy, Check, ToggleLeft, ToggleRight, Globe, ArrowLeft, Building2, Mail } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().optional().nullable(),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});
type ClientForm = z.infer<typeof clientSchema>;

const licenseSchema = z.object({
  clientId: z.coerce.number().optional().nullable(),
  domain: z.string().min(1, "Domain is required"),
  pluginAccess: z.enum(["all", "specific"]),
  productIds: z.array(z.number()).optional().nullable(),
  status: z.enum(["active", "revoked"]).optional(),
});
type LicenseForm = z.infer<typeof licenseSchema>;

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const { data: licenses } = useListLicenses();
  const { data: products } = useListProducts();
  const clientMutations = useClientMutations();

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  const [licenseDialogOpen, setLicenseDialogOpen] = useState(false);
  const [editingLicenseId, setEditingLicenseId] = useState<number | null>(null);
  const [licenseForClientId, setLicenseForClientId] = useState<number | null>(null);
  const [newLicenseKey, setNewLicenseKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const licenseMutations = useLicenseMutations((key) => {
    setNewLicenseKey(key);
    setLicenseDialogOpen(false);
  });

  const clientForm = useForm<ClientForm>({ resolver: zodResolver(clientSchema) });
  const licenseForm = useForm<LicenseForm>({
    resolver: zodResolver(licenseSchema),
    defaultValues: { pluginAccess: "all", productIds: [] },
  });
  const pluginAccess = licenseForm.watch("pluginAccess");

  const selectedClient = clients?.find((c) => c.id === selectedClientId);
  const clientLicenses = licenses?.filter((l) => l.clientId === selectedClientId) || [];
  const unassignedLicenses = licenses?.filter((l) => !l.clientId) || [];

  const openCreateClient = () => {
    setEditingClientId(null);
    clientForm.reset({ name: "", company: "", email: "", notes: "" });
    setClientDialogOpen(true);
  };

  const openEditClient = (client: { id: number; name: string; company?: string | null; email?: string | null; notes?: string | null }) => {
    setEditingClientId(client.id);
    clientForm.reset({
      name: client.name,
      company: client.company || "",
      email: client.email || "",
      notes: client.notes || "",
    });
    setClientDialogOpen(true);
  };

  const onClientSubmit = (data: ClientForm) => {
    if (editingClientId) {
      clientMutations.update.mutate({ id: editingClientId, data }, { onSuccess: () => setClientDialogOpen(false) });
    } else {
      clientMutations.create.mutate({ data }, {
        onSuccess: (result) => {
          setClientDialogOpen(false);
          setSelectedClientId(result.id);
          openCreateLicense(result.id);
        }
      });
    }
  };

  const openCreateLicense = (clientId: number) => {
    setEditingLicenseId(null);
    setLicenseForClientId(clientId);
    licenseForm.reset({ clientId, domain: "", pluginAccess: "all", productIds: [], status: "active" });
    setLicenseDialogOpen(true);
  };

  const openEditLicense = (license: { id: number; clientId?: number | null; domain: string; pluginAccess: string; productIds?: number[] | null; status: string }) => {
    setEditingLicenseId(license.id);
    setLicenseForClientId(license.clientId || null);
    licenseForm.reset({
      clientId: license.clientId || 0,
      domain: license.domain,
      pluginAccess: license.pluginAccess as "all" | "specific",
      productIds: license.productIds || [],
      status: license.status as "active" | "revoked",
    });
    setLicenseDialogOpen(true);
  };

  const onLicenseSubmit = (data: LicenseForm) => {
    const payload = {
      ...data,
      clientId: licenseForClientId || data.clientId,
      productIds: data.pluginAccess === "specific" ? data.productIds : null,
    };

    if (editingLicenseId) {
      licenseMutations.update.mutate({ id: editingLicenseId, data: payload }, { onSuccess: () => setLicenseDialogOpen(false) });
    } else {
      licenseMutations.create.mutate({ data: payload });
    }
  };

  const copyKey = () => {
    if (newLicenseKey) {
      navigator.clipboard.writeText(newLicenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage clients and their license keys"
        action={<Button onClick={openCreateClient}><Plus className="w-4 h-4 mr-2" /> Add Client</Button>}
      />

      {isLoading ? (
        <div className="animate-pulse h-64 bg-white rounded-2xl border border-slate-200"></div>
      ) : clients?.length === 0 ? (
        <div className="text-center py-24 px-4 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-900">No clients found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-8">Add a client to start issuing licenses.</p>
          <Button onClick={openCreateClient}>Add First Client</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-1.5">
            {clients?.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-all duration-150",
                  selectedClientId === client.id
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20"
                    : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 truncate">{client.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0 ml-2">
                    {client.licenseCount}
                  </Badge>
                </div>
                {(client.company || client.email) && (
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    {client.company && (
                      <span className="flex items-center gap-1 truncate">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {client.company}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {client.email}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}

            {unassignedLicenses.length > 0 && (
              <button
                onClick={() => setSelectedClientId(-1)}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-all duration-150 mt-4",
                  selectedClientId === -1
                    ? "bg-amber-50 border-amber-200 ring-2 ring-amber-500/20"
                    : "bg-white border-dashed border-slate-300 hover:border-amber-300 hover:shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-700">Unassigned</span>
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                    {unassignedLicenses.length}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">Licenses not linked to any client</p>
              </button>
            )}
          </div>

          <div className="lg:col-span-3">
            {selectedClientId === -1 ? (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900">Unassigned Licenses</h2>
                    <p className="text-sm text-slate-500 mt-1">Edit a license to reassign it to a client.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {unassignedLicenses.map((license) => (
                    <div key={license.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono text-slate-500">{license.licenseKeyPreview}</code>
                          <Badge variant={license.status === "active" ? "default" : "destructive"} className="text-xs">
                            {license.status}
                          </Badge>
                          <Badge variant={license.pluginAccess === "all" ? "secondary" : "outline"} className="text-xs">
                            {license.pluginAccess === "all" ? "All Plugins" : "Specific"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <Globe className="w-3 h-3" />
                          {license.domain}
                          <span className="mx-1">·</span>
                          {formatDate(license.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => licenseMutations.toggle.mutate({ id: license.id })} title={license.status === "active" ? "Revoke" : "Activate"}>
                          {license.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLicense(license)}>
                          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          if (confirm("Delete this license? This cannot be undone.")) licenseMutations.remove.mutate({ id: license.id });
                        }}>
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : selectedClient ? (
              <Card className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-display font-bold text-slate-900">{selectedClient.name}</h2>
                    <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-500">
                      {selectedClient.company && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {selectedClient.company}
                        </span>
                      )}
                      {selectedClient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {selectedClient.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEditClient(selectedClient)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => {
                      if (confirm("Delete this client? Existing licenses will become unassigned.")) {
                        clientMutations.remove.mutate({ id: selectedClient.id });
                        setSelectedClientId(null);
                      }
                    }}>
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-4 h-4" />
                    Licenses ({clientLicenses.length})
                  </h3>
                  <Button size="sm" onClick={() => openCreateLicense(selectedClient.id)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> Add License
                  </Button>
                </div>

                {clientLicenses.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl">
                    <Key className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No licenses yet</p>
                    <Button variant="link" size="sm" onClick={() => openCreateLicense(selectedClient.id)} className="mt-1">
                      Issue first license
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientLicenses.map((license) => (
                      <div key={license.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="text-xs font-mono text-slate-500">{license.licenseKeyPreview}</code>
                            <Badge variant={license.status === "active" ? "default" : "destructive"} className="text-xs">
                              {license.status}
                            </Badge>
                            <Badge variant={license.pluginAccess === "all" ? "secondary" : "outline"} className="text-xs">
                              {license.pluginAccess === "all" ? "All Plugins" : "Specific"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                            <Globe className="w-3 h-3" />
                            {license.domain}
                            <span className="mx-1">·</span>
                            {formatDate(license.createdAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => licenseMutations.toggle.mutate({ id: license.id })} title={license.status === "active" ? "Revoke" : "Activate"}>
                            {license.status === "active" ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditLicense(license)}>
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            if (confirm("Delete this license? This cannot be undone.")) licenseMutations.remove.mutate({ id: license.id });
                          }}>
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center py-16">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Select a client to view their licenses</p>
                  <p className="text-sm text-slate-400 mt-1">Click on a client in the list to get started</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Client Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClientId ? "Edit Client" : "Add Client"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label>
              <Input {...clientForm.register("name")} placeholder="Jane Doe" className={clientForm.formState.errors.name ? "border-rose-300" : ""} />
              {clientForm.formState.errors.name && <p className="text-rose-500 text-xs mt-1">{clientForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
              <Input {...clientForm.register("company")} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <Input {...clientForm.register("email")} type="email" placeholder="jane@example.com" className={clientForm.formState.errors.email ? "border-rose-300" : ""} />
              {clientForm.formState.errors.email && <p className="text-rose-500 text-xs mt-1">{clientForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                {...clientForm.register("notes")}
                className="flex w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 min-h-[100px] resize-y"
                placeholder="Internal notes..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={clientMutations.create.isPending || clientMutations.update.isPending}>Save Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={licenseDialogOpen} onOpenChange={setLicenseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLicenseId ? "Edit License" : "Issue License"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={licenseForm.handleSubmit(onLicenseSubmit)} className="space-y-4 mt-4">
            {!licenseForClientId && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Client</label>
                <Controller
                  control={licenseForm.control}
                  name="clientId"
                  render={({ field }) => (
                    <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Domain *</label>
              <Input {...licenseForm.register("domain")} placeholder="example.com" className={licenseForm.formState.errors.domain ? "border-rose-300" : ""} />
              <p className="text-xs text-slate-500 mt-1">Will be normalized (strips scheme, www, trailing slash).</p>
              {licenseForm.formState.errors.domain && <p className="text-rose-500 text-xs mt-1">{licenseForm.formState.errors.domain.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Plugin Access</label>
              <Controller
                control={licenseForm.control}
                name="pluginAccess"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plugins</SelectItem>
                      <SelectItem value="specific">Specific Plugins</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {pluginAccess === "specific" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Products</label>
                <div className="border border-slate-200 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto bg-slate-50">
                  <Controller
                    control={licenseForm.control}
                    name="productIds"
                    render={({ field }) => (
                      <>
                        {products?.map((p) => (
                          <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(field.value || []).includes(p.id)}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, p.id]);
                                } else {
                                  field.onChange(current.filter((id: number) => id !== p.id));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-slate-700">{p.name}</span>
                          </label>
                        ))}
                        {(!products || products.length === 0) && (
                          <p className="text-sm text-slate-400">No products available</p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            )}

            {editingLicenseId && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                <Controller
                  control={licenseForm.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value || "active"} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="revoked">Revoked</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setLicenseDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={licenseMutations.create.isPending || licenseMutations.update.isPending}>
                {editingLicenseId ? "Save Changes" : "Issue License"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* License Key Display */}
      {newLicenseKey && (
        <Dialog open={!!newLicenseKey} onOpenChange={() => setNewLicenseKey(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>License Key Created</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-sm text-slate-500 mb-4">
                Copy this license key now. It will not be shown again.
              </p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
                <code className="flex-1 font-mono text-sm text-slate-900 break-all">{newLicenseKey}</code>
                <Button variant="outline" size="icon" onClick={copyKey} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
