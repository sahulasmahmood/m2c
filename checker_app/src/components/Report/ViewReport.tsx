import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Linking, Modal } from 'react-native';
import {
  ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle,
  Building2, ShieldCheck, Factory, Settings, ClipboardList, Package,
  Download, ExternalLink, Camera, Clock,
} from 'lucide-react-native';
// Lazy-loaded — these are native modules that require a dev build rebuild.
// Importing at top-level crashes in Expo Go or stale dev builds.
let Print: any = null;
let Sharing: any = null;
try {
  Print = require('expo-print');
  Sharing = require('expo-sharing');
} catch {
  // Will show a rebuild prompt when user taps Download PDF
}
import qcCheckerService from '../../services/qcCheckerService';

interface ViewReportProps {
  reportId: string;
  onBack?: () => void;
}

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <View className="mb-3">
    <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</Text>
    <Text className="text-sm font-semibold text-gray-900">{value || '—'}</Text>
  </View>
);

const YesNoRow = ({ label, value }: { label: string; value?: string }) => {
  const v = (value || '').toLowerCase();
  const isYes = v === 'yes' || v === 'pass' || v === 'passed';
  const isNo = v === 'no' || v === 'fail' || v === 'failed';

  const Icon = isYes ? CheckCircle2 : isNo ? XCircle : AlertCircle;
  const color = isYes ? '#10b981' : isNo ? '#ef4444' : '#f59e0b';
  const textColor = isYes ? 'text-emerald-600' : isNo ? 'text-red-600' : 'text-amber-600';

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
      <Text className="text-sm text-gray-700 flex-1">{label}</Text>
      {value ? (
        <View className="flex-row items-center bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
          <Icon size={14} color={color} />
          <Text className={`text-xs font-bold ml-1.5 ${textColor}`}>{value}</Text>
        </View>
      ) : (
        <Text className="text-gray-400 text-xs">—</Text>
      )}
    </View>
  );
};

const Section = ({ title, icon: Icon, accent, children }: {
  title: string;
  icon: any;
  accent: { bg: string; border: string; text: string; icon: string };
  children: React.ReactNode;
}) => (
  <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
    <View className={`flex-row items-center px-5 py-4 border-b border-gray-100 ${accent.bg}`}>
      <View className={`p-1.5 rounded-lg mr-3 ${accent.border}`}>
        <Icon size={18} color={accent.icon} />
      </View>
      <Text className={`font-bold text-base ${accent.text}`}>{title}</Text>
    </View>
    <View className="p-5">{children}</View>
  </View>
);

// Reusable tap-to-enlarge photo tile
const PhotoTile = ({
  src, label, onPress,
}: { src: string; label?: string; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className="rounded-xl overflow-hidden border border-gray-200 mb-1"
    style={{ width: '31%', aspectRatio: 1, marginRight: '2%' }}
  >
    <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    {label ? (
      <View className="absolute bottom-0 left-0 right-0 bg-black px-1 py-0.5" style={{ opacity: 0.55 }}>
        <Text className="text-white text-[9px] font-semibold text-center" numberOfLines={1}>{label}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

export function ViewReport({ reportId, onBack }: ViewReportProps) {
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await qcCheckerService.getMyInspectionById(reportId);
        if (mounted) {
          if (res.success) {
            setInspection(res.inspection);
          } else {
            setError('Report not found');
          }
        }
      } catch (e: any) {
        if (mounted) {
          setError(e.message || 'Failed to load report');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [reportId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-gray-500 font-medium">Loading report...</Text>
      </View>
    );
  }

  if (error || !inspection) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <AlertCircle size={48} color="#f59e0b" />
        <Text className="mt-4 text-gray-600 text-sm text-center">{error || 'Inspection not found'}</Text>
        {onBack && (
          <TouchableOpacity onPress={onBack} className="mt-4">
            <Text className="text-blue-600 text-sm font-medium underline">Go back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // After completion, itemsToInspect holds the submitted form data object
  const fd = inspection.itemsToInspect && !Array.isArray(inspection.itemsToInspect)
    ? inspection.itemsToInspect : {};
  // Original items assigned by admin
  const assignedItems = Array.isArray(inspection.itemsToInspect) ? inspection.itemsToInspect : [];

  const getResultStyle = (result: string) => {
    switch (result) {
      case 'PASSED': return { bg: 'bg-emerald-100', text: 'text-emerald-800' };
      case 'FAILED': return { bg: 'bg-red-100', text: 'text-red-800' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800' };
    }
  };

  const resultStyle = inspection.result ? getResultStyle(inspection.result) : { bg: 'bg-gray-100', text: 'text-gray-800' };

  const handleDownloadPdf = async () => {
    if (!Print || !Sharing) {
      Alert.alert('Rebuild Required', 'PDF generation requires a new dev build.\n\nRun: eas build --platform android --profile development');
      return;
    }
    setDownloading(true);
    try {
      const vendorName = inspection.vendor?.companyName || fd.vendorName || 'Report';
      const safeName = vendorName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Factory_Report_${safeName}_${reportId.slice(-8).toUpperCase()}.pdf`;
      const html = buildReportHtml(inspection, fd, assignedItems, reportId);
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // Rename to match web filename format
      const { File } = require('expo-file-system/next');
      const source = new File(uri);
      const newUri = `${uri.substring(0, uri.lastIndexOf('/'))}/${filename}`;
      await source.move(new File(newUri));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Factory Report — ${vendorName}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF Saved', `Report saved to:\n${uri}`);
      }
    } catch (err: any) {
      Alert.alert('PDF Error', err?.message || 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
    <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View className="flex-row items-center mb-4">
        {onBack && (
          <TouchableOpacity onPress={onBack} className="p-2.5 bg-white border border-gray-200 rounded-xl mr-3">
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
        )}
        <View className="flex-1">
          <Text className="text-2xl font-extrabold text-gray-900 mb-1">Inspection Report</Text>
          <Text className="text-gray-500 text-xs font-mono">
            {inspection.vendor?.companyName || fd.vendorName || 'Unknown'} {'\u2022'} REF: {reportId.slice(-8).toUpperCase()}
          </Text>
        </View>
        {inspection.result && (
          <View className={`px-3 py-1.5 rounded-full ${resultStyle.bg} flex-row items-center`}>
            {inspection.result === 'PASSED' && <CheckCircle2 size={12} color="#059669" />}
            {inspection.result === 'FAILED' && <XCircle size={12} color="#dc2626" />}
            <Text className={`text-[10px] font-bold ml-1 ${resultStyle.text}`}>{inspection.result}</Text>
          </View>
        )}
      </View>

      {/* Download PDF */}
      <TouchableOpacity
        onPress={handleDownloadPdf}
        disabled={downloading}
        activeOpacity={0.85}
        className="flex-row items-center justify-center rounded-xl py-3 mb-6"
        style={{ backgroundColor: '#222222', opacity: downloading ? 0.6 : 1 }}
      >
        <Download size={16} color="#ffffff" />
        <Text className="text-white font-bold text-sm ml-2">
          {downloading ? 'Generating...' : 'Download PDF'}
        </Text>
      </TouchableOpacity>

      {/* Summary Banner */}
      <View className="rounded-2xl p-5 mb-6 flex-row flex-wrap" style={{ backgroundColor: '#222222' }}>
        <View className="w-1/2 mb-4">
          <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Vendor</Text>
          <Text className="font-semibold text-white text-sm" style={{ lineHeight: 20 }}>
            {inspection.vendor?.companyName || fd.vendorName || '—'}
          </Text>
        </View>
        <View className="w-1/2 mb-4">
          <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Client</Text>
          <Text className="font-semibold text-white text-sm" style={{ lineHeight: 20 }}>
            {inspection.clientName || '—'}
          </Text>
        </View>
        <View className="w-1/2">
          <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Completed On</Text>
          <Text className="font-semibold text-white text-sm">
            {inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString('en-IN') : '—'}
          </Text>
        </View>
        <View className="w-1/2">
          <Text className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#9ca3af' }}>Priority</Text>
          <Text className="font-semibold text-white text-sm">{inspection.priority || '—'}</Text>
        </View>
      </View>

      {/* SECTION 1: Factory Details */}
      <Section
        title="Section 1 — Factory Details"
        icon={Factory}
        accent={{ bg: 'bg-neutral-50', border: 'bg-neutral-100', text: 'text-neutral-900', icon: '#374151' }}
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2"><InfoRow label="Vendor Name" value={fd.vendorName} /></View>
          <View className="w-1/2"><InfoRow label="Factory Name" value={fd.factoryName} /></View>
          <View className="w-1/2 pr-2"><InfoRow label="Factory Address" value={fd.factoryAddress} /></View>
          <View className="w-1/2"><InfoRow label="Contact Person" value={fd.contactPersonName} /></View>
          <View className="w-1/2 pr-2"><InfoRow label="Contact Phone" value={fd.contactPhoneNumber} /></View>
        </View>
      </Section>

      {/* SECTION 2: Legal & Registration */}
      <Section
        title="Section 2 — Legal & Registration"
        icon={ShieldCheck}
        accent={{ bg: 'bg-neutral-50', border: 'bg-neutral-100', text: 'text-neutral-900', icon: '#374151' }}
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2"><InfoRow label="Business Reg. No." value={fd.businessRegistrationNumber} /></View>
          <View className="w-1/2"><InfoRow label="GST / Tax ID" value={fd.gstTaxId} /></View>
          <View className="w-full"><InfoRow label="Factory License No." value={fd.factoryLicenseNumber} /></View>
        </View>
      </Section>

      {/* SECTION 3: Production Info */}
      <Section
        title="Section 3 — Production Info"
        icon={Settings}
        accent={{ bg: 'bg-purple-50', border: 'bg-purple-100', text: 'text-purple-900', icon: '#7c3aed' }}
      >
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2"><InfoRow label="Products Manufactured" value={fd.productsManufactured} /></View>
          <View className="w-1/2"><InfoRow label="Monthly Capacity" value={fd.monthlyProductionCapacity} /></View>
          <View className="w-1/2 pr-2"><InfoRow label="Production Workers" value={fd.numberOfProductionWorkers} /></View>
          <View className="w-1/2"><InfoRow label="Category to Inspect" value={fd.categoryToInspect} /></View>
        </View>
      </Section>

      {/* SECTION 4: Basic Infrastructure */}
      <Section
        title="Section 4 — Basic Infrastructure"
        icon={Building2}
        accent={{ bg: 'bg-teal-50', border: 'bg-teal-100', text: 'text-teal-900', icon: '#0d9488' }}
      >
        <YesNoRow label="Machinery Available" value={fd.machineryAvailable} />
        <YesNoRow label="Electricity Available" value={fd.electricityAvailable} />
        <YesNoRow label="Water Available" value={fd.waterAvailable} />
        <YesNoRow label="Storage Area Available" value={fd.storageAreaAvailable} />
      </Section>

      {/* SECTION 5: Quality & Safety */}
      <Section
        title="Section 5 — Quality & Safety"
        icon={ShieldCheck}
        accent={{ bg: 'bg-emerald-50', border: 'bg-emerald-100', text: 'text-emerald-900', icon: '#059669' }}
      >
        <YesNoRow label="Quality Check Process in Place" value={fd.qualityCheckProcess} />
        <YesNoRow label="Safety Equipment Available" value={fd.safetyEquipment} />
        <YesNoRow label="Clean Working Environment" value={fd.cleanWorkingEnvironment} />
      </Section>

      {/* SECTION 6: Inspection Info */}
      <Section
        title="Section 6 — Inspection Info"
        icon={ClipboardList}
        accent={{ bg: 'bg-orange-50', border: 'bg-orange-100', text: 'text-orange-900', icon: '#ea580c' }}
      >
        <View className="flex-row flex-wrap mb-2">
          <View className="w-1/2 pr-2"><InfoRow label="Inspection Date" value={fd.inspectionDate} /></View>
          <View className="w-1/2"><InfoRow label="Inspector Name" value={fd.inspectorName || inspection.checker?.name} /></View>
          <View className="w-1/2 pr-2"><InfoRow label="Inspection Status" value={fd.inspectionStatus} /></View>
        </View>
        {(fd.inspectorRemarks || inspection.notes) && (
          <View className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 mt-2">
            <Text className="text-[10px] font-bold text-neutral-700 uppercase mb-1">Remarks</Text>
            <Text className="text-sm text-neutral-900" style={{ lineHeight: 20 }} selectable>
              {fd.inspectorRemarks || inspection.notes}
            </Text>
          </View>
        )}
      </Section>

      {/* SECTION 7: Selfies */}
      {(fd.beforeSelfiePhoto || fd.afterSelfiePhoto) && (
        <Section
          title="Selfie Verification"
          icon={Camera}
          accent={{ bg: 'bg-violet-50', border: 'bg-violet-100', text: 'text-violet-900', icon: '#7c3aed' }}
        >
          <View className="flex-row flex-wrap">
            {[{
              key: 'before',
              photo: fd.beforeSelfiePhoto,
              takenAt: fd.beforeSelfieTakenAt,
              label: 'Before Inspection',
            }, {
              key: 'after',
              photo: fd.afterSelfiePhoto,
              takenAt: fd.afterSelfieTakenAt,
              label: 'After Inspection',
            }].map(({ key, photo, takenAt, label }) => {
              const src = photo?.data || photo?.url || (typeof photo === 'string' ? photo : null);
              if (!src) return null;
              return (
                <View key={key} className="mr-3 mb-3" style={{ width: '44%' }}>
                  <TouchableOpacity
                    onPress={() => setLightboxUri(src)}
                    activeOpacity={0.85}
                    className="rounded-2xl overflow-hidden border-2 border-violet-200"
                    style={{ aspectRatio: 0.85 }}
                  >
                    <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  </TouchableOpacity>
                  <Text className="text-xs font-bold text-violet-700 mt-1.5">{label}</Text>
                  {takenAt ? (
                    <View className="flex-row items-center mt-0.5">
                      <Clock size={10} color="#9ca3af" />
                      <Text className="text-[10px] text-gray-400 ml-1">
                        {new Date(takenAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </Text>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </Section>
      )}

      {/* SECTION 8: Evidence */}
      {((fd.factoryPhotos?.length > 0) || (fd.documentsUpload?.length > 0)) && (
        <Section
          title="Section 7 — Evidence"
          icon={FileText}
          accent={{ bg: 'bg-rose-50', border: 'bg-rose-100', text: 'text-rose-900', icon: '#e11d48' }}
        >
          {fd.factoryPhotos?.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Factory Photos ({fd.factoryPhotos.length})
              </Text>
              <View className="flex-row flex-wrap">
                {fd.factoryPhotos.map((p: any, i: number) => {
                  const src = p?.data || p?.url || null;
                  const isImage = src && typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http'));
                  return isImage ? (
                    <PhotoTile
                      key={i}
                      src={src}
                      label={p?.name || `Photo ${i + 1}`}
                      onPress={() => setLightboxUri(src)}
                    />
                  ) : (
                    <View key={i} className="rounded-xl border border-dashed border-gray-300 bg-gray-100 items-center justify-center mb-1" style={{ width: '31%', aspectRatio: 1, marginRight: '2%' }}>
                      <Text className="text-[10px] text-gray-500 text-center px-1" numberOfLines={2}>{p?.name || `Photo ${i + 1}`}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
          {fd.documentsUpload?.length > 0 && (
            <View>
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Documents ({fd.documentsUpload.length})
              </Text>
              <View className="gap-y-2">
                {fd.documentsUpload.map((doc: any, i: number) => {
                  const src = doc?.data || doc?.url || null;
                  const canOpen = src && typeof src === 'string' && src.startsWith('http');
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={canOpen ? 0.7 : 1}
                      onPress={() => canOpen && Linking.openURL(src)}
                      className="flex-row items-center bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2.5"
                    >
                      <FileText size={14} color="#374151" />
                      <Text className="text-xs font-medium text-neutral-700 ml-2 flex-1" selectable>
                        {doc?.name || `Document ${i + 1}`}
                      </Text>
                      {canOpen ? <ExternalLink size={12} color="#64748b" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </Section>
      )}

      {/* Assigned Items */}
      {assignedItems.length > 0 && (
        <Section
          title="Items Assigned for Inspection"
          icon={Package}
          accent={{ bg: 'bg-gray-50', border: 'bg-gray-100', text: 'text-gray-800', icon: '#374151' }}
        >
          <View className="gap-y-3">
            {assignedItems.map((item: any, i: number) => (
              <View key={i} className="flex-row items-start p-4 bg-gray-50 rounded-xl border border-gray-200">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900 text-sm">{item.itemName}</Text>
                  {item.description && (
                    <Text className="text-xs text-gray-500 mt-0.5">{item.description}</Text>
                  )}
                </View>
                {item.aqlLevel && (
                  <View className="items-center ml-3">
                    <Text className="font-bold text-blue-600 text-sm">{item.aqlLevel}</Text>
                    <Text className="text-[10px] text-gray-500">AQL</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Timestamps */}
      <View className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-6">
        <View className="flex-row flex-wrap">
          <View className="w-1/2 pr-2 mb-2">
            <InfoRow label="Scheduled Date" value={inspection.scheduledDate} />
          </View>
          <View className="w-1/2 mb-2">
            <InfoRow
              label="Started At"
              value={inspection.startedAt ? new Date(inspection.startedAt).toLocaleString('en-IN') : undefined}
            />
          </View>
          <View className="w-1/2 pr-2">
            <InfoRow
              label="Completed At"
              value={inspection.completedAt ? new Date(inspection.completedAt).toLocaleString('en-IN') : undefined}
            />
          </View>
        </View>
      </View>
    </ScrollView>

    {/* Photo Lightbox */}
    {lightboxUri ? (
      <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setLightboxUri(null)}
          className="flex-1 bg-black items-center justify-center"
        >
          <TouchableOpacity
            onPress={() => setLightboxUri(null)}
            className="absolute top-12 right-4 w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <XCircle size={22} color="#ffffff" />
          </TouchableOpacity>
          <Image
            source={{ uri: lightboxUri }}
            style={{ width: '95%', height: '70%' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    ) : null}
  </>
  );
}

// ─── PDF HTML Generator ──────────────────────────────────────────────────────

function buildReportHtml(inspection: any, fd: any, assignedItems: any[], reportId: string): string {
  const esc = (s?: string | null) => (s || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const vendorName = esc(inspection.vendor?.companyName || fd.vendorName);
  const resultColor = inspection.result === 'PASSED' ? '#059669' : inspection.result === 'FAILED' ? '#dc2626' : '#6b7280';

  const row = (label: string, value?: string | null) =>
    `<tr><td style="color:#6b7280;font-size:11px;padding:6px 12px;text-transform:uppercase;font-weight:600;width:40%">${label}</td><td style="font-size:13px;padding:6px 12px;font-weight:600">${esc(value)}</td></tr>`;

  const yesNo = (label: string, value?: string) => {
    const v = (value || '').toLowerCase();
    const color = v === 'yes' ? '#059669' : v === 'no' ? '#dc2626' : '#f59e0b';
    return `<tr><td style="padding:8px 12px;font-size:13px">${label}</td><td style="padding:8px 12px;font-weight:600;color:${color};font-size:13px">${esc(value)}</td></tr>`;
  };

  const sectionHeader = (title: string) =>
    `<div style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:13px;color:#1e293b">${title}</div>`;

  const photos = (fd.factoryPhotos || [])
    .filter((p: any) => {
      const src = p?.data || p?.url;
      return src && typeof src === 'string' && src.startsWith('http');
    })
    .map((p: any, i: number) =>
      `<img src="${p.data || p.url}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0" alt="Photo ${i + 1}" />`
    )
    .join('');

  const items = assignedItems
    .map((item: any) =>
      `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:8px">
        <div style="font-weight:600;font-size:13px">${esc(item.itemName)}</div>
        ${item.description ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${esc(item.description)}</div>` : ''}
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
  .banner { background: #222; color: #fff; border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; flex-wrap: wrap; }
  .banner-item { width: 50%; margin-bottom: 12px; }
  .banner-label { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
  .banner-value { font-size: 13px; font-weight: 600; }
  .section { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  tr { border-bottom: 1px solid #f1f5f9; }
  .result { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: white; background: ${resultColor}; }
  .photos { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; }
  @media print { .page-break { page-break-before: always; } }
</style></head>
<body>
  <!-- Company Header with Logo -->
  <div style="display:flex;align-items:center;margin-bottom:8px">
    <div style="width:36px;height:36px;background:#222;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:10px">
      <span style="color:#fff;font-weight:900;font-size:14px;letter-spacing:1px">M2C</span>
    </div>
    <div>
      <p style="font-size:11px;font-weight:700;color:#222;margin:0;letter-spacing:0.5px">M 2 C MarkDowns Private Limited</p>
      <p style="font-size:8px;color:#888;margin:2px 0 0">Quality Control Division</p>
    </div>
  </div>
  <hr style="border:none;border-top:1.5px solid #222;margin:0 0 16px" />

  <!-- Report Title -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div>
      <h1 style="font-size:22px;margin:0 0 4px">Factory Inspection Report</h1>
      <p style="font-size:12px;color:#6b7280;margin:0">${vendorName} &bull; REF: ${reportId.slice(-8).toUpperCase()}</p>
    </div>
    ${inspection.result ? `<span class="result">${inspection.result}</span>` : ''}
  </div>

  <div class="banner">
    <div class="banner-item"><div class="banner-label">Vendor</div><div class="banner-value">${vendorName}</div></div>
    <div class="banner-item"><div class="banner-label">Client</div><div class="banner-value">${esc(inspection.clientName)}</div></div>
    <div class="banner-item"><div class="banner-label">Completed On</div><div class="banner-value">${inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString('en-IN') : '—'}</div></div>
    <div class="banner-item"><div class="banner-label">Priority</div><div class="banner-value">${esc(inspection.priority)}</div></div>
  </div>

  <div class="section">${sectionHeader('Section 1 — Factory Details')}<table>
    ${row('Vendor Name', fd.vendorName)}${row('Factory Name', fd.factoryName)}${row('Factory Address', fd.factoryAddress)}
    ${row('Contact Person', fd.contactPersonName)}${row('Contact Phone', fd.contactPhoneNumber)}
  </table></div>

  <div class="section">${sectionHeader('Section 2 — Legal & Registration')}<table>
    ${row('Business Reg. No.', fd.businessRegistrationNumber)}${row('GST / Tax ID', fd.gstTaxId)}${row('Factory License No.', fd.factoryLicenseNumber)}
  </table></div>

  <div class="section">${sectionHeader('Section 3 — Production Info')}<table>
    ${row('Products Manufactured', fd.productsManufactured)}${row('Monthly Capacity', fd.monthlyProductionCapacity)}
    ${row('Production Workers', fd.numberOfProductionWorkers)}${row('Category to Inspect', fd.categoryToInspect)}
  </table></div>

  <div class="section">${sectionHeader('Section 4 — Basic Infrastructure')}<table>
    ${yesNo('Machinery Available', fd.machineryAvailable)}${yesNo('Electricity Available', fd.electricityAvailable)}
    ${yesNo('Water Available', fd.waterAvailable)}${yesNo('Storage Area Available', fd.storageAreaAvailable)}
  </table></div>

  <div class="section">${sectionHeader('Section 5 — Quality & Safety')}<table>
    ${yesNo('Quality Check Process', fd.qualityCheckProcess)}${yesNo('Safety Equipment', fd.safetyEquipment)}
    ${yesNo('Clean Working Environment', fd.cleanWorkingEnvironment)}
  </table></div>

  <div class="section">${sectionHeader('Section 6 — Inspection Info')}<table>
    ${row('Inspection Date', fd.inspectionDate)}${row('Inspector Name', fd.inspectorName || inspection.checker?.name)}
    ${row('Inspection Status', fd.inspectionStatus)}
  </table>
  ${(fd.inspectorRemarks || inspection.notes) ? `<div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 16px">
    <div style="font-size:10px;font-weight:600;color:#374151;text-transform:uppercase;margin-bottom:4px">Remarks</div>
    <div style="font-size:13px">${esc(fd.inspectorRemarks || inspection.notes)}</div>
  </div>` : ''}
  </div>

  ${photos ? `<div class="section">${sectionHeader('Section 7 — Evidence')}<div class="photos">${photos}</div></div>` : ''}

  ${items ? `<div class="section">${sectionHeader('Items Assigned for Inspection')}<div style="padding:12px">${items}</div></div>` : ''}

  <div class="section"><div style="padding:12px"><table>
    ${row('Scheduled Date', inspection.scheduledDate)}
    ${row('Started At', inspection.startedAt ? new Date(inspection.startedAt).toLocaleString('en-IN') : undefined)}
    ${row('Completed At', inspection.completedAt ? new Date(inspection.completedAt).toLocaleString('en-IN') : undefined)}
  </table></div></div>

  <!-- Signature Page -->
  <div style="page-break-before:always;padding-top:40px">
    <div style="text-align:center;margin-bottom:30px">
      <h2 style="font-size:18px;font-weight:700;color:#222;margin:0 0 6px">Factory Inspection Report</h2>
      <p style="font-size:12px;color:#888;margin:0">Authorization &amp; Sign-off</p>
    </div>

    <hr style="border:none;border-top:2px solid #222;margin:0 40px 30px" />

    <div style="padding:0 40px">
      <div style="margin-bottom:30px">
        <p style="font-size:12px;font-weight:700;margin:0 0 8px">Inspector Signature:</p>
        <div style="border-bottom:1px solid #999;height:24px"></div>
      </div>

      <div style="margin-bottom:30px">
        <p style="font-size:12px;font-weight:700;margin:0 0 8px">Inspector Name:</p>
        <div style="border-bottom:1px solid #999;height:24px"></div>
      </div>

      <div style="margin-bottom:30px">
        <p style="font-size:12px;font-weight:700;margin:0 0 8px">Date:</p>
        <div style="border-bottom:1px solid #999;height:24px;font-size:12px;padding-top:4px">
          ${inspection.completedAt ? new Date(inspection.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
        </div>
      </div>

      <div style="margin-bottom:30px">
        <p style="font-size:12px;font-weight:700;margin:0 0 8px">Company Stamp:</p>
        <div style="border:1px dashed #bbb;height:80px;border-radius:8px"></div>
      </div>
    </div>

    <hr style="border:none;border-top:2px solid #222;margin:10px 40px 16px" />

    <div style="text-align:center;padding:0 30px">
      <p style="font-size:9px;color:#888;font-style:italic;margin:0 0 4px">
        This is a system-generated report. Valid only with authorized signature and company stamp.
      </p>
      <p style="font-size:9px;color:#888;font-style:italic;margin:0">
        Report generated on: ${new Date().toLocaleString('en-IN')}
      </p>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:9px;color:#bbb;margin-top:30px;padding-top:10px;border-top:1px solid #eee">
    Confidential — M2C MarkDowns Pvt. Ltd.
  </div>
</body></html>`;
}
