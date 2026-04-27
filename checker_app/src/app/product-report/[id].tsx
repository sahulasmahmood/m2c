import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, Modal, Alert, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Package,
  ClipboardList, Ruler, Box, Bug, FlaskConical, Camera,
  Star, Download, FileText, ExternalLink, RefreshCw, Clock,
} from 'lucide-react-native';
import qcCheckerService from '../../services/qcCheckerService';

let Print: any = null;
let Sharing: any = null;
try { Print = require('expo-print'); Sharing = require('expo-sharing'); } catch {}

const REMARK_LABELS: Record<string, string> = {
  shipperCartonRemark: 'Shipper Carton',
  innerCartonRemark: 'Inner Carton',
  retailPackagingRemark: 'Retail Packaging',
  productTypeRemark: 'Product Type',
  aqlWorkmanshipRemark: 'AQL Workmanship',
  onSiteTestsRemark: 'On-site Tests',
};

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  QC_APPROVED: { bg: '#d1fae5', text: '#065f46' },
  APPROVED: { bg: '#d1fae5', text: '#065f46' },
  REJECTED: { bg: '#fee2e2', text: '#991b1b' },
  REINSPECTION: { bg: '#fef3c7', text: '#92400e' },
  PENDING: { bg: '#f1f5f9', text: '#334155' },
};

const STATUS_LABELS: Record<string, string> = {
  QC_APPROVED: 'QC Approved', APPROVED: 'Approved', REJECTED: 'Rejected',
  REINSPECTION: 'Reinspection', PENDING: 'Pending',
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="py-2">
      <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</Text>
      <Text className="text-sm text-slate-900" style={{ lineHeight: 20 }} selectable>{value ?? '—'}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
      <View className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <Text className="text-sm font-bold text-slate-900">{title}</Text>
      </View>
      <View className="p-4">{children}</View>
    </View>
  );
}

function PhotoGrid({ photos, label, onTap }: { photos: any[]; label: string; onTap: (uri: string) => void }) {
  if (!photos || photos.length === 0) return null;
  return (
    <View className="mt-3">
      <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label} ({photos.length})
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {photos.map((p: any, i: number) => {
          const src = typeof p === 'string' ? p : p?.data || p?.url || null;
          return src && typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http')) ? (
            <TouchableOpacity key={i} onPress={() => onTap(src)} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
              <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </TouchableOpacity>
          ) : (
            <View key={i} className="w-20 h-20 bg-slate-100 rounded-xl border border-dashed border-slate-300 items-center justify-center">
              <Text className="text-[9px] text-slate-500 text-center px-1">{(typeof p !== 'string' && p?.name) || `${i + 1}`}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProductReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await qcCheckerService.getProductDetails(id);
        if (res.success) setProduct(res.data.product);
        else setError('Product not found');
      } catch (e: any) {
        setError(e?.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#222222" />
        <Text className="mt-4 text-slate-600 text-sm">Loading report...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center px-4 pb-3" style={{ paddingTop: insets.top + 8, backgroundColor: '#fff' }}>
          <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-100">
            <ArrowLeft size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <AlertCircle size={40} color="#f59e0b" />
          <Text className="mt-4 text-slate-600 text-center">{error || 'Not found'}</Text>
        </View>
      </View>
    );
  }

  const fd = (product.qcInspectionData || {}) as Record<string, any>;
  const status = product.approvalStatus || 'PENDING';
  const pill = STATUS_STYLE[status] || STATUS_STYLE.PENDING;
  const items = Array.isArray(fd.items) ? fd.items : [];
  const measurements = Array.isArray(fd.measurements) ? fd.measurements : [];
  const tests = Array.isArray(fd.tests) ? fd.tests : [];

  const handleDownloadPdf = async () => {
    if (!Print || !Sharing) {
      Alert.alert('Rebuild Required', 'PDF requires a dev build rebuild.');
      return;
    }
    setDownloading(true);
    try {
      const safeName = (product.name || 'Product').replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Product_Report_${safeName}_${product.baseSku || id}.pdf`;
      const html = buildProductReportHtml(product, fd, items, measurements, tests);
      const { uri } = await Print.printToFileAsync({ html });

      // Rename to match web filename
      try {
        const { File } = require('expo-file-system/next');
        const source = new File(uri);
        const newUri = `${uri.substring(0, uri.lastIndexOf('/'))}/${filename}`;
        await source.move(new File(newUri));
        var finalUri = newUri;
      } catch { var finalUri = uri; }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(finalUri, { mimeType: 'application/pdf', dialogTitle: `Product Report — ${product.name}`, UTI: 'com.adobe.pdf' });
      } else {
        Alert.alert('Saved', uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-100 flex-row items-center justify-between px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center rounded-full bg-slate-100">
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-900">Product Report</Text>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: pill.bg }}>
          <Text className="text-[10px] font-bold" style={{ color: pill.text }}>
            {STATUS_LABELS[status] || status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Product name */}
        <Text className="text-xl font-extrabold text-slate-900 mb-0.5">{product.name}</Text>
        <Text className="text-xs text-slate-500 mb-4">SKU: {product.baseSku || 'N/A'}</Text>

        {/* Download PDF */}
        <TouchableOpacity onPress={handleDownloadPdf} disabled={downloading} activeOpacity={0.85}
          className="flex-row items-center justify-center rounded-xl py-3 mb-4"
          style={{ backgroundColor: '#222', opacity: downloading ? 0.6 : 1 }}>
          <Download size={16} color="#fff" />
          <Text className="text-white font-bold text-sm ml-2">{downloading ? 'Generating...' : 'Download PDF'}</Text>
        </TouchableOpacity>

        {/* Summary banner */}
        <View className="rounded-2xl p-4 mb-4 flex-row flex-wrap" style={{ backgroundColor: '#222' }}>
          {[
            ['Product', product.name],
            ['Vendor', product.vendor?.companyName],
            ['Category', product.category],
            ['Inspected On', product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN') : '—'],
          ].map(([label, val], i) => (
            <View key={i} className="w-1/2 mb-3">
              <Text className="text-[10px] font-bold uppercase mb-0.5" style={{ color: '#9ca3af' }}>{label}</Text>
              <Text className="text-sm font-semibold text-white">{val || '—'}</Text>
            </View>
          ))}
        </View>

        {/* Rejection reason */}
        {product.rejectionReason ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <Text className="text-[10px] font-bold text-red-700 uppercase mb-1">Rejection Reason</Text>
            <Text className="text-sm text-red-900" selectable>{product.rejectionReason}</Text>
          </View>
        ) : null}

        {/* S1: General Information */}
        <Section title="Section 1 — General Information">
          <InfoRow label="Client" value={fd.client} />
          <InfoRow label="Vendor" value={fd.vendor} />
          <InfoRow label="Factory" value={fd.factory} />
          <InfoRow label="Service Location" value={fd.serviceLocation} />
          <InfoRow label="Service Start Date" value={fd.serviceStartDate} />
          <InfoRow label="Service Type" value={fd.serviceType} />
        </Section>

        {/* S2: Preparation */}
        <Section title="Section 2 — Preparation">
          {items.length > 0 ? items.map((it: any, i: number) => (
            <View key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-2">
              <Text className="text-sm font-semibold text-slate-900">{it.itemName || `Item ${i + 1}`}</Text>
              {it.itemDescription ? <Text className="text-xs text-slate-500 mt-0.5">{it.itemDescription}</Text> : null}
              <View className="flex-row mt-2" style={{ columnGap: 16 }}>
                <Text className="text-xs text-slate-600">Total: <Text className="font-bold">{it.totalQuantity ?? '—'}</Text></Text>
                <Text className="text-xs text-slate-600">Inspection: <Text className="font-bold">{it.inspectionQuantity ?? '—'}</Text></Text>
              </View>
            </View>
          )) : <Text className="text-sm text-slate-400">No items recorded.</Text>}
          <PhotoGrid photos={fd.warehousePhotoEvidences} label="Warehouse Photos" onTap={setLightboxUri} />
        </Section>

        {/* S3: Measurements */}
        <Section title="Section 3 — Measurements">
          {measurements.length > 0 ? measurements.map((m: any, i: number) => (
            <View key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-2">
              <Text className="text-xs font-bold text-slate-700 mb-1">{m.sampleName || `Sample #${i + 1}`}</Text>
              <View className="flex-row flex-wrap" style={{ columnGap: 12, rowGap: 4 }}>
                {[['Carton L', m.cartonLength], ['W', m.cartonWidth], ['H', m.cartonHeight],
                  ['Product L', m.productLength], ['W', m.productWidth],
                  ['Retail Wt', m.retailWeight], ['Gross Wt', m.cartonGrossWeight]].map(([l, v], j) => (
                  <Text key={j} className="text-[10px] text-slate-600">{l}: <Text className="font-bold">{v ?? '—'}</Text></Text>
                ))}
              </View>
            </View>
          )) : <Text className="text-sm text-slate-400">No measurements recorded.</Text>}
          <PhotoGrid photos={fd.measurementPhotos} label="Measurement Photos" onTap={setLightboxUri} />
        </Section>

        {/* S4: Packaging & Remarks */}
        <Section title="Section 4 — Packaging & Remarks">
          {Object.entries(REMARK_LABELS).map(([key, label]) => {
            const val = fd[key];
            const num = Number(val);
            const color = val ? (num >= 8 ? '#059669' : num >= 6 ? '#d97706' : '#dc2626') : '#94a3b8';
            return (
              <View key={key} className="flex-row items-center justify-between py-2.5 border-b border-slate-100">
                <Text className="text-sm text-slate-700 flex-1">{label}</Text>
                <Text className="text-sm font-bold" style={{ color }}>{val ? `${val}/10` : '—'}</Text>
              </View>
            );
          })}
          <PhotoGrid photos={fd.packagingPhotos} label="Packaging Photos" onTap={setLightboxUri} />
        </Section>

        {/* S5: Defects & AQL */}
        <Section title="Section 5 — Defects & AQL">
          <View className="flex-row mb-3" style={{ columnGap: 16 }}>
            <InfoRow label="Inspection Level" value={fd.inspectionLevel} />
            <InfoRow label="Sample Size" value={fd.sampleSize} />
          </View>
          {[
            { label: 'Critical', aql: fd.aqlCritical, max: fd.maxAllowedCritical, found: fd.criticalDefects, details: fd.criticalDefectDetails, detailColor: '#fee2e2' },
            { label: 'Major', aql: fd.aqlMajor, max: fd.maxAllowedMajor, found: fd.majorDefects, details: fd.majorDefectDetails, detailColor: '#fef3c7' },
            { label: 'Minor', aql: fd.aqlMinor, max: fd.maxAllowedMinor, found: fd.minorDefects, details: fd.minorDefectDetails, detailColor: '#f1f5f9' },
          ].map((r) => {
            const exceeded = r.found != null && r.max != null && Number(r.found) > Number(r.max);
            return (
              <View key={r.label} className="mb-2">
                <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
                  <Text className="text-sm font-semibold text-slate-700 w-16">{r.label}</Text>
                  <Text className="text-xs text-slate-500">AQL: {r.aql ?? '—'}</Text>
                  <Text className="text-xs text-slate-500">Max: {r.max ?? '—'}</Text>
                  <Text className="text-xs font-bold text-slate-900">Found: {r.found ?? '—'}</Text>
                  {r.found != null ? (
                    exceeded
                      ? <XCircle size={14} color="#dc2626" />
                      : <CheckCircle size={14} color="#059669" />
                  ) : null}
                </View>
                {r.details ? (
                  <View className="rounded-lg p-3 mt-1" style={{ backgroundColor: r.detailColor }}>
                    <Text className="text-xs text-slate-900" selectable>{r.details}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <PhotoGrid photos={fd.defectPhotos} label="Defect Photos" onTap={setLightboxUri} />
        </Section>

        {/* S6: Testing */}
        <Section title="Section 6 — On-site Testing">
          {tests.length > 0 ? (
            <View style={{ rowGap: 10 }}>
              {tests.map((t: any, i: number) => (
                <View key={t.id || i} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-semibold text-slate-900">{t.label || `Test ${i + 1}`}</Text>
                      {t.detail ? <Text className="text-xs text-slate-500 mt-0.5">{t.detail}</Text> : null}
                    </View>
                    {t.pass ? (
                      <View className="flex-row items-center bg-emerald-100 rounded-full px-2.5 py-1">
                        <CheckCircle size={12} color="#059669" />
                        <Text className="text-[10px] font-bold text-emerald-700 ml-1">PASS</Text>
                      </View>
                    ) : t.fail ? (
                      <View className="flex-row items-center bg-red-100 rounded-full px-2.5 py-1">
                        <XCircle size={12} color="#dc2626" />
                        <Text className="text-[10px] font-bold text-red-700 ml-1">FAIL</Text>
                      </View>
                    ) : <Text className="text-xs text-slate-400">No decision</Text>}
                  </View>
                  <PhotoGrid photos={t.rightPhotos} label="Correct Photos" onTap={setLightboxUri} />
                  <PhotoGrid photos={t.wrongPhotos} label="Incorrect Photos" onTap={setLightboxUri} />
                </View>
              ))}
            </View>
          ) : <Text className="text-sm text-slate-400">No tests recorded.</Text>}
          <PhotoGrid photos={fd.testingPhotos} label="General Testing Photos" onTap={setLightboxUri} />
        </Section>

        {/* S7: Documentation */}
        <Section title="Section 7 — Documentation">
          <InfoRow label="Inspector Signature" value={fd.inspectorSignature} />
          <PhotoGrid photos={fd.documentationPhotos} label="Documentation Photos" onTap={setLightboxUri} />
          <PhotoGrid photos={fd.photocopyDocuments} label="Photocopy Documents" onTap={setLightboxUri} />
          <PhotoGrid photos={fd.companyIdCards} label="Company ID Cards" onTap={setLightboxUri} />
        </Section>

        {/* S8: Selfie Verification */}
        {(fd.beforeSelfiePhoto || fd.afterSelfiePhoto) ? (
          <Section title="Selfie Verification">
            <View className="flex-row flex-wrap">
              {([
                { key: 'before', photo: fd.beforeSelfiePhoto, takenAt: fd.beforeSelfieTakenAt, label: 'Before Inspection' },
                { key: 'after',  photo: fd.afterSelfiePhoto,  takenAt: fd.afterSelfieTakenAt,  label: 'After Inspection'  },
              ] as const).map(({ key, photo, takenAt, label }) => {
                const src = photo?.data || photo?.url || (typeof photo === 'string' ? photo : null);
                if (!src) return null;
                return (
                  <View key={key} style={{ width: '44%', marginRight: 12, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => setLightboxUri(src)}
                      activeOpacity={0.85}
                      className="rounded-2xl overflow-hidden border-2 border-violet-200"
                      style={{ aspectRatio: 0.85 }}
                    >
                      <Image source={{ uri: src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      {/* violet overlay label */}
                      <View className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ backgroundColor: 'rgba(109,40,217,0.65)' }}>
                        <Text className="text-white text-[10px] font-bold text-center">{label}</Text>
                      </View>
                    </TouchableOpacity>
                    {takenAt ? (
                      <View className="flex-row items-center mt-1.5">
                        <Clock size={10} color="#9ca3af" />
                        <Text className="text-[10px] text-slate-400 ml-1">
                          {new Date(takenAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </Section>
        ) : null}

        {/* S9: Review & Decision */}
        <Section title="Section 8 — Review & Final Decision">
          <View className="flex-row items-center mb-3" style={{ columnGap: 10 }}>
            <Text className="text-sm text-slate-700">Final Decision:</Text>
            {fd.finalDecision === 'Approved' ? (
              <View className="flex-row items-center bg-emerald-100 rounded-full px-3 py-1">
                <CheckCircle size={14} color="#059669" />
                <Text className="text-sm font-bold text-emerald-700 ml-1.5">Approved</Text>
              </View>
            ) : fd.finalDecision === 'Rejected' ? (
              <View className="flex-row items-center bg-red-100 rounded-full px-3 py-1">
                <XCircle size={14} color="#dc2626" />
                <Text className="text-sm font-bold text-red-700 ml-1.5">Rejected</Text>
              </View>
            ) : <Text className="text-sm text-slate-400">{fd.finalDecision || '—'}</Text>}
          </View>
          {fd.reviewerRemarks ? (
            <View className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
              <Text className="text-[10px] font-bold text-neutral-700 uppercase mb-1">Reviewer Remarks</Text>
              <Text className="text-sm text-neutral-900" style={{ lineHeight: 20 }} selectable>{fd.reviewerRemarks}</Text>
            </View>
          ) : null}
        </Section>

        {/* Timestamps */}
        <View className="bg-white rounded-xl border border-slate-200 p-4">
          <InfoRow label="Product Listed" value={product.createdAt ? new Date(product.createdAt).toLocaleString('en-IN') : undefined} />
          <InfoRow label="Inspected On" value={product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-IN') : undefined} />
          <InfoRow label="Approval Status" value={STATUS_LABELS[status] || status} />
        </View>
      </ScrollView>

      {/* Lightbox */}
      {lightboxUri ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setLightboxUri(null)}>
          <TouchableOpacity activeOpacity={1} onPress={() => setLightboxUri(null)} className="flex-1 bg-black items-center justify-center">
            <TouchableOpacity onPress={() => setLightboxUri(null)} className="absolute top-12 right-4 w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <XCircle size={22} color="#fff" />
            </TouchableOpacity>
            <Image source={{ uri: lightboxUri }} style={{ width: '95%', height: '70%' }} resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
  );
}

function buildProductReportHtml(product: any, fd: any, items: any[], measurements: any[], tests: any[]) {
  const esc = (s?: any) => String(s ?? '—').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const row = (l: string, v?: any) => `<tr><td style="color:#6b7280;font-size:11px;padding:6px 12px;text-transform:uppercase;font-weight:600;width:40%">${l}</td><td style="font-size:13px;padding:6px 12px;font-weight:600">${esc(v)}</td></tr>`;
  const sh = (t: string) => `<div style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:13px;color:#1e293b">${t}</div>`;
  const photoGrid = (photos: any[], label: string) => {
    if (!photos || photos.length === 0) return '';
    const imgs = photos.map((p: any, i: number) => {
      const src = typeof p === 'string' ? p : p?.data || p?.url;
      return src && typeof src === 'string' && src.startsWith('http')
        ? `<img src="${src}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0" alt="${label} ${i+1}"/>`
        : `<div style="width:100px;height:100px;background:#f1f5f9;border-radius:8px;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8">${(typeof p !== 'string' && p?.name) || `${i+1}`}</div>`;
    }).join('');
    return `<div style="margin-top:12px"><p style="font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;margin:0 0 8px">${label} (${photos.length})</p><div style="display:flex;flex-wrap:wrap;gap:8px">${imgs}</div></div>`;
  };
  const remarkColor = (v: any) => {
    const n = Number(v);
    return n >= 8 ? '#059669' : n >= 6 ? '#d97706' : '#dc2626';
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,Helvetica,sans-serif;margin:0;padding:24px;color:#1e293b;font-size:13px}
  .s{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:16px}
  table{width:100%;border-collapse:collapse}tr{border-bottom:1px solid #f1f5f9}
  th{text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;background:#f8fafc}
  td{padding:6px 8px;font-size:12px}
  </style></head><body>
  <!-- Header -->
  <div style="display:flex;align-items:center;margin-bottom:8px"><div style="width:36px;height:36px;background:#222;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-right:10px"><span style="color:#fff;font-weight:900;font-size:14px">M2C</span></div><div><p style="font-size:11px;font-weight:700;color:#222;margin:0">M 2 C MarkDowns Private Limited</p><p style="font-size:8px;color:#888;margin:2px 0 0">Quality Control Division</p></div></div>
  <hr style="border:none;border-top:1.5px solid #222;margin:0 0 16px"/>
  <h1 style="font-size:20px;margin:0 0 4px">Product Inspection Report</h1>
  <p style="font-size:12px;color:#6b7280;margin:0 0 16px">${esc(product.name)} &bull; SKU: ${esc(product.baseSku)}</p>

  <!-- Banner -->
  <div style="background:#222;color:#fff;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;flex-wrap:wrap">
  ${[['Product', product.name], ['Vendor', product.vendor?.companyName], ['Category', product.category], ['Inspected On', product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN') : '—']].map(([l, v]) => `<div style="width:50%;margin-bottom:10px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:2px">${l}</div><div style="font-size:13px;font-weight:600">${esc(v)}</div></div>`).join('')}
  </div>

  ${product.rejectionReason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:16px"><p style="font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;margin:0 0 4px">Rejection Reason</p><p style="font-size:13px;color:#7f1d1d;margin:0">${esc(product.rejectionReason)}</p></div>` : ''}

  <!-- S1: General -->
  <div class="s">${sh('Section 1 — General Information')}<table>${row('Client', fd.client)}${row('Vendor', fd.vendor)}${row('Factory', fd.factory)}${row('Service Location', fd.serviceLocation)}${row('Service Start Date', fd.serviceStartDate)}${row('Service Type', fd.serviceType)}</table></div>

  <!-- S2: Preparation -->
  <div class="s">${sh('Section 2 — Preparation')}<div style="padding:12px">
  ${items.length > 0 ? items.map((it: any) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:8px"><div style="font-weight:600">${esc(it.itemName)}</div>${it.itemDescription ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${esc(it.itemDescription)}</div>` : ''}<div style="margin-top:6px;font-size:11px;color:#475569">Total Qty: <strong>${it.totalQuantity ?? '—'}</strong> &nbsp; Inspection Qty: <strong>${it.inspectionQuantity ?? '—'}</strong></div></div>`).join('') : '<p style="color:#94a3b8">No items recorded.</p>'}
  ${photoGrid(fd.warehousePhotoEvidences, 'Warehouse Photos')}
  </div></div>

  <!-- S3: Measurements -->
  <div class="s">${sh('Section 3 — Measurements')}<div style="padding:12px">
  ${measurements.length > 0 ? `<div style="overflow-x:auto"><table><tr><th>Sample</th><th>Carton L</th><th>Carton W</th><th>Carton H</th><th>Product L</th><th>Product W</th><th>Retail Wt</th><th>Gross Wt</th></tr>
  ${measurements.map((m: any, i: number) => `<tr><td style="font-weight:600">${esc(m.sampleName) || `#${i+1}`}</td><td>${m.cartonLength ?? '—'}</td><td>${m.cartonWidth ?? '—'}</td><td>${m.cartonHeight ?? '—'}</td><td>${m.productLength ?? '—'}</td><td>${m.productWidth ?? '—'}</td><td>${m.retailWeight ?? '—'}</td><td>${m.cartonGrossWeight ?? '—'}</td></tr>`).join('')}
  </table></div>` : '<p style="color:#94a3b8">No measurements recorded.</p>'}
  ${photoGrid(fd.measurementPhotos, 'Measurement Photos')}
  </div></div>

  <!-- S4: Packaging -->
  <div class="s">${sh('Section 4 — Packaging & Remarks')}<div style="padding:0">
  ${Object.entries(REMARK_LABELS).map(([k, l]) => {
    const v = fd[k];
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #f1f5f9"><span style="font-size:13px;color:#334155">${l}</span><span style="font-size:13px;font-weight:700;color:${v ? remarkColor(v) : '#94a3b8'}">${v ? `${v}/10` : '—'}</span></div>`;
  }).join('')}
  ${photoGrid(fd.packagingPhotos, 'Packaging Photos')}
  </div></div>

  <!-- S5: Defects -->
  <div class="s">${sh('Section 5 — Defects & AQL')}<div style="padding:12px">
  <table>${row('Inspection Level', fd.inspectionLevel)}${row('Sample Size', fd.sampleSize)}</table>
  <div style="overflow-x:auto;margin:12px 0"><table><tr><th>Type</th><th>AQL</th><th>Max Allowed</th><th>Found</th><th>Status</th></tr>
  ${[
    { label: 'Critical', aql: fd.aqlCritical, max: fd.maxAllowedCritical, found: fd.criticalDefects },
    { label: 'Major', aql: fd.aqlMajor, max: fd.maxAllowedMajor, found: fd.majorDefects },
    { label: 'Minor', aql: fd.aqlMinor, max: fd.maxAllowedMinor, found: fd.minorDefects },
  ].map(r => {
    const exceeded = r.found != null && r.max != null && Number(r.found) > Number(r.max);
    return `<tr><td style="font-weight:600">${r.label}</td><td>${r.aql ?? '—'}</td><td>${r.max ?? '—'}</td><td>${r.found ?? '—'}</td><td style="font-weight:600;color:${r.found != null ? (exceeded ? '#dc2626' : '#059669') : '#94a3b8'}">${r.found != null ? (exceeded ? '✗ Exceeded' : '✓ Within Limit') : '—'}</td></tr>`;
  }).join('')}
  </table></div>
  ${fd.criticalDefectDetails ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px;margin-bottom:8px"><p style="font-size:10px;font-weight:700;color:#991b1b;text-transform:uppercase;margin:0 0 4px">Critical Defect Details</p><p style="margin:0;font-size:12px;color:#7f1d1d">${esc(fd.criticalDefectDetails)}</p></div>` : ''}
  ${fd.majorDefectDetails ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px;margin-bottom:8px"><p style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;margin:0 0 4px">Major Defect Details</p><p style="margin:0;font-size:12px;color:#78350f">${esc(fd.majorDefectDetails)}</p></div>` : ''}
  ${fd.minorDefectDetails ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px"><p style="font-size:10px;font-weight:700;color:#334155;text-transform:uppercase;margin:0 0 4px">Minor Defect Details</p><p style="margin:0;font-size:12px;color:#1e293b">${esc(fd.minorDefectDetails)}</p></div>` : ''}
  ${photoGrid(fd.defectPhotos, 'Defect Photos')}
  </div></div>

  <!-- S6: Testing -->
  <div class="s">${sh('Section 6 — On-site Testing')}<div style="padding:12px">
  ${tests.length > 0 ? tests.map((t: any, i: number) => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:10px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div><strong>${esc(t.label || `Test ${i+1}`)}</strong>${t.detail ? `<div style="font-size:11px;color:#6b7280;margin-top:2px">${esc(t.detail)}</div>` : ''}</div>
      <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;color:${t.pass ? '#059669' : t.fail ? '#dc2626' : '#6b7280'};background:${t.pass ? '#d1fae5' : t.fail ? '#fee2e2' : '#f1f5f9'}">${t.pass ? 'PASS' : t.fail ? 'FAIL' : 'N/A'}</span>
    </div>
    ${photoGrid(t.rightPhotos, 'Correct Photos')}
    ${photoGrid(t.wrongPhotos, 'Incorrect Photos')}
  </div>`).join('') : '<p style="color:#94a3b8">No tests recorded.</p>'}
  ${photoGrid(fd.testingPhotos, 'General Testing Photos')}
  </div></div>

  <!-- S7: Documentation -->
  <div class="s">${sh('Section 7 — Documentation')}<div style="padding:12px">
  <table>${row('Inspector Signature', fd.inspectorSignature)}</table>
  ${photoGrid(fd.documentationPhotos, 'Documentation Photos')}
  ${photoGrid(fd.photocopyDocuments, 'Photocopy Documents')}
  ${photoGrid(fd.companyIdCards, 'Company ID Cards')}
  </div></div>

  <!-- Selfie Verification -->
  ${(fd.beforeSelfiePhoto || fd.afterSelfiePhoto) ? `<div class="s">${sh('Selfie Verification')}<div style="display:flex;gap:16px;padding:16px">
  ${[{ photo: fd.beforeSelfiePhoto, takenAt: fd.beforeSelfieTakenAt, label: 'Before Inspection' },
     { photo: fd.afterSelfiePhoto,  takenAt: fd.afterSelfieTakenAt,  label: 'After Inspection'  }]
    .map(({ photo, takenAt, label }) => {
      const src = photo?.data || photo?.url || (typeof photo === 'string' ? photo : null);
      if (!src || !src.startsWith('http')) return '';
      return `<div style="text-align:center">
        <img src="${src}" style="width:160px;height:190px;object-fit:cover;border-radius:12px;border:2px solid #ddd6fe" alt="${label}"/>
        <div style="font-size:11px;font-weight:700;color:#6d28d9;margin-top:6px">${label}</div>
        ${takenAt ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">${new Date(takenAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</div>` : ''}
      </div>`;
    }).join('')}
  </div></div>` : ''}

  <!-- S8: Decision -->
  <div class="s">${sh('Section 8 — Final Decision')}<div style="padding:12px">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
    <span style="font-size:13px;color:#334155">Final Decision:</span>
    <span style="font-size:13px;font-weight:700;padding:4px 14px;border-radius:20px;color:${fd.finalDecision === 'Approved' ? '#059669' : fd.finalDecision === 'Rejected' ? '#dc2626' : '#334155'};background:${fd.finalDecision === 'Approved' ? '#d1fae5' : fd.finalDecision === 'Rejected' ? '#fee2e2' : '#f1f5f9'}">${esc(fd.finalDecision)}</span>
  </div>
  ${fd.reviewerRemarks ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px"><p style="font-size:10px;font-weight:600;color:#374151;text-transform:uppercase;margin:0 0 4px">Reviewer Remarks</p><p style="margin:0;font-size:13px">${esc(fd.reviewerRemarks)}</p></div>` : ''}
  </div></div>

  <!-- Timestamps -->
  <div class="s"><div style="padding:12px"><table>${row('Product Listed', product.createdAt ? new Date(product.createdAt).toLocaleString('en-IN') : undefined)}${row('Inspected On', product.updatedAt ? new Date(product.updatedAt).toLocaleString('en-IN') : undefined)}${row('Approval Status', STATUS_LABELS[product.approvalStatus] || product.approvalStatus)}</table></div></div>

  <!-- Signature Page -->
  <div style="page-break-before:always;padding-top:40px;text-align:center">
    <h2 style="font-size:18px;color:#222;margin:0 0 6px">Product Inspection Report</h2>
    <p style="font-size:12px;color:#888;margin:0 0 30px">Authorization &amp; Sign-off</p>
    <hr style="border:none;border-top:2px solid #222;margin:0 40px 30px"/>
    <div style="padding:0 40px;text-align:left">
      <p style="font-weight:700;margin:0 0 8px">Inspector Signature:</p><div style="border-bottom:1px solid #999;height:24px;margin-bottom:30px"></div>
      <p style="font-weight:700;margin:0 0 8px">Inspector Name:</p><div style="border-bottom:1px solid #999;height:24px;margin-bottom:30px"></div>
      <p style="font-weight:700;margin:0 0 8px">Date:</p><div style="border-bottom:1px solid #999;height:24px;margin-bottom:30px;font-size:12px;padding-top:4px">${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</div>
      <p style="font-weight:700;margin:0 0 8px">Company Stamp:</p><div style="border:1px dashed #bbb;height:80px;border-radius:8px"></div>
    </div>
    <hr style="border:none;border-top:2px solid #222;margin:30px 40px 16px"/>
    <p style="font-size:9px;color:#888;font-style:italic">This is a system-generated report. Valid only with authorized signature and company stamp.</p>
    <p style="font-size:9px;color:#888;font-style:italic">Report generated on: ${new Date().toLocaleString('en-IN')}</p>
  </div>

  <div style="text-align:center;font-size:9px;color:#bbb;margin-top:30px;padding-top:10px;border-top:1px solid #eee">Confidential — M2C MarkDowns Pvt. Ltd.</div>
  </body></html>`;
}
