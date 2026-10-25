import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FastReportGenerator from './components/FastReportGenerator';
import RawDataViewer from './components/RawDataViewer';
import ReportConfig from './components/ReportConfig';
import ReportViewer from './components/ReportViewer';
import SplitView from './components/SplitView';
import { SAMPLE_DATASETS } from './utils/sampleData';
import { parseExcelFile, parseRawText, extractSheetData, analyzeColumns } from './utils/excelReader';
import { REPORT_TOPICS, REPORT_THEMES, detectT01Months, detectVoMonths, detectVoIndividualMonths, generateT01Columns, generateVoColumns, generateVoIndividualColumns, generateLakhpatiColumns, generateVprpColumns, generateP01Columns, generateEkycColumns, getPreviousDate } from './utils/reportTemplates';
import { generateReportData } from './utils/formulaEngine';
import { exportToStyledExcel, exportToCSV } from './utils/excelExporter';
import {
  getSavedBlockTargets,
  applyTargetPresetToManualValues,
  matchBlockPreset
} from './utils/targetPresets';
import TargetPresetModal from './components/TargetPresetModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('report'); // Default to Report view
  const [selectedTopicId, setSelectedTopicId] = useState('ekyc_progress');
  const [fileInfo, setFileInfo] = useState(null);
  const [reportMeta, setReportMeta] = useState({
    presetId: 'ekyc_progress',
    title: 'S01 - Member KYC Details',
    subtitle: 'S01 - Member KYC Details Panchayat: All Panchayats',
    companyName: 'Block: KOTWA',
    district: 'PURBI CHAMPARAN',
    panchayat: 'All Panchayats',
    todayDate: '13-10-2026',
    yesterdayDate: '12-10-2026',
    dayBeforeYesterdayDate: '10-10-2026',
    dateLabel: 'Date:-12-10-2026',
    currentDate: '13-10-2026',
    prevDate: '12-10-2026',
    theme: 'ekyc_olive',
    layoutType: 'ekyc_grid',
    sortByCol: 'e-KYC Gap',
    sortDir: 'desc',
    groupBy: ''
  });
  const [columns, setColumns] = useState([]);
  const [availableMonths, setAvailableMonths] = useState(['September 2026', 'August 2026', 'July 2026']);
  const [selectedMonths, setSelectedMonths] = useState(['September 2026', 'August 2026']);
  const [isExporting, setIsExporting] = useState(false);
  const [toast, setToast] = useState(null);
  const [savedBlockTargets, setSavedBlockTargets] = useState(() => getSavedBlockTargets());
  const [selectedTargetBlockId, setSelectedTargetBlockId] = useState('KOTWA');
  const [showTargetModal, setShowTargetModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Toggle month for T01 report (SHG or VO)
  const handleToggleMonth = (monthName) => {
    if (selectedMonths.includes(monthName)) {
      if (selectedMonths.length <= 1) {
        showToast('At least one month must remain in the report.', 'error');
        return;
      }
      const newSelected = selectedMonths.filter(m => m !== monthName);
      setSelectedMonths(newSelected);
      if (selectedTopicId === 't01_vo_individual') {
        setColumns(generateVoIndividualColumns(newSelected));
      } else if (selectedTopicId === 't01_vo_transactions') {
        setColumns(generateVoColumns(newSelected));
      } else {
        setColumns(generateT01Columns(newSelected));
      }
      showToast(`Removed "${monthName}" from report.`);
    } else {
      const newSelected = availableMonths.filter(m => selectedMonths.includes(m) || m === monthName);
      setSelectedMonths(newSelected);
      if (selectedTopicId === 't01_vo_individual') {
        setColumns(generateVoIndividualColumns(newSelected));
      } else if (selectedTopicId === 't01_vo_transactions') {
        setColumns(generateVoColumns(newSelected));
      } else {
        setColumns(generateT01Columns(newSelected));
      }
      showToast(`Included "${monthName}" in report.`);
    }
  };

  // Handle dynamic e-KYC date updates:
  // When Today's date is set, Yesterday = -1 day (or skip Sun), DayBeforeYesterday = -1 day (or skip Sun).
  // Column 1 will show: "With e-KYC Adhaar [Yesterday]"
  // Column 2 will show: "With e-KYC Adhaar [Day Before Yesterday]"
  // Subheader will show: "Date:-[Yesterday]"
  const handleEkycDateChange = ({ today, yesterday, dayBeforeYesterday }) => {
    let tDate = today !== undefined ? today : (reportMeta.todayDate || '13-10-2026');
    let yDate = yesterday;
    let prevYDate = dayBeforeYesterday;

    if (today !== undefined && yesterday === undefined) {
      yDate = getPreviousDate(tDate, 1) || '12-10-2026';
      prevYDate = getPreviousDate(yDate, 1) || '10-10-2026';
    } else if (yesterday !== undefined && dayBeforeYesterday === undefined) {
      yDate = yesterday;
      prevYDate = getPreviousDate(yDate, 1) || '10-10-2026';
    } else {
      yDate = yDate !== undefined ? yDate : (reportMeta.yesterdayDate || '12-10-2026');
      prevYDate = prevYDate !== undefined ? prevYDate : (reportMeta.dayBeforeYesterdayDate || '10-10-2026');
    }

    setReportMeta(prev => ({
      ...prev,
      todayDate: tDate,
      yesterdayDate: yDate,
      dayBeforeYesterdayDate: prevYDate,
      currentDate: tDate,
      prevDate: yDate,
      dateLabel: `Date:-${yDate}`
    }));

    if (selectedTopicId === 'ekyc_progress') {
      setColumns(generateEkycColumns(yDate, prevYDate));
    }
  };

  // Switch report topic
  const handleSelectTopic = (topicId, customHeaders = null) => {
    const topic = REPORT_TOPICS.find(t => t.id === topicId) || REPORT_TOPICS[0];
    setSelectedTopicId(topic.id);

    const isP01 = topic.id === 'p01_shg_households';
    const isLakhpati = topic.id === 'lakhpati_didi';
    const isVprp = topic.id === 'vprp_entry';
    const isVoIndividual = topic.id === 't01_vo_individual';
    const isVo = topic.id === 't01_vo_transactions';
    const isEkyc = topic.id === 'ekyc_progress';
    const isT01 = topic.id === 't01_transactions';

    const defaultDateLabel = isP01
      ? (topic.dateLabel || 'Date:-14-10-2026')
      : isLakhpati
      ? (topic.dateLabel || 'Date:-21-10-2026')
      : isVprp
      ? (topic.dateLabel || 'Date:-22-10-2026')
      : isVoIndividual
      ? (topic.dateLabel || 'Date:-12-10-2026')
      : isVo
      ? (topic.dateLabel || 'Date:-13-10-2026')
      : isT01
      ? (topic.dateLabel || 'Date:-10-10-2026')
      : `Date:-${reportMeta.yesterdayDate || topic.yesterdayDate || '12-10-2026'}`;

    setReportMeta(prev => ({
      ...prev,
      presetId: topic.id,
      title: topic.title,
      subtitle: topic.subtitle,
      companyName: topic.companyName || prev.companyName || 'Block: KOTWA',
      district: topic.district || prev.district || 'PURBI CHAMPARAN',
      panchayat: (isVo || isVoIndividual) ? '' : (topic.panchayat || prev.panchayat || 'All Panchayats'),
      todayDate: prev.todayDate || topic.todayDate || '13-10-2026',
      yesterdayDate: prev.yesterdayDate || topic.yesterdayDate || '12-10-2026',
      dayBeforeYesterdayDate: prev.dayBeforeYesterdayDate || topic.dayBeforeYesterdayDate || '10-10-2026',
      dateLabel: defaultDateLabel,
      currentDate: isP01 ? (topic.currentDate || '14-10-2026') : isLakhpati ? (topic.currentDate || '21-10-2026') : isVprp ? (topic.currentDate || '22-10-2026') : isVoIndividual ? (topic.currentDate || '12-10-2026') : isVo ? (topic.currentDate || '13-10-2026') : isT01 ? (topic.currentDate || '10-10-2026') : (prev.todayDate || '13-10-2026'),
      prevDate: isP01 ? '13-10-2026' : isLakhpati ? '20-10-2026' : isVprp ? '21-10-2026' : isVoIndividual ? '10-10-2026' : isVo ? '10-10-2026' : isT01 ? (topic.prevDate || '10-10-2026') : (prev.yesterdayDate || '12-10-2026'),
      reportDate: isP01 ? (topic.reportDate || '13-10-2026') : prev.reportDate,
      period: isP01 ? (topic.period || 'October-2026') : prev.period,
      theme: topic.theme || (isLakhpati ? 'lakhpati_yellow' : isVprp ? 'vprp_yellow' : 'ekyc_olive'),
      layoutType: topic.layoutType || (isP01 ? 'p01_grid' : isLakhpati ? 'lakhpati_grid' : isVprp ? 'vprp_grid' : isVoIndividual ? 't01_vo_individual_grid' : isVo ? 't01_vo_grid' : isT01 ? 't01_grid' : 'ekyc_grid'),
      sortByCol: topic.sortByCol || '',
      sortDir: topic.sortDir || 'asc',
      downloadInfo: topic.downloadInfo || prev.downloadInfo
    }));

    const currentHeaders = customHeaders || fileInfo?.headers || [];

    if (isP01) {
      const pDate = topic.reportDate || '13-10-2026';
      const pPeriod = topic.period || 'October-2026';
      setColumns(generateP01Columns(pDate, pPeriod));
      if (!currentHeaders.some(h => h.includes('Till March-23') || h.includes('Members in Cumulative'))) {
        loadDataset('p01_shg_households');
        return;
      }
    } else if (isLakhpati) {
      setColumns(generateLakhpatiColumns());
      const preset = savedBlockTargets[selectedTargetBlockId] || savedBlockTargets['KOTWA'];
      if (preset) {
        const currentGps = fileInfo?.data?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) || [];
        setManualValues(prev => applyTargetPresetToManualValues(preset, prev, currentGps));
      }
      if (!currentHeaders.some(h => h.includes('Potential Lakhpati Didi') || h.includes('Active Approved Potential Didis'))) {
        loadDataset('lakhpati_didi');
        return;
      }
    } else if (isVprp) {
      setColumns(generateVprpColumns());
      if (!currentHeaders.some(h => h.includes('Total SHG Prepared ENT Plan') || h.includes('Total SHG prepared Entitlement Plan') || h.includes('Entitlement Plan Gap') || (h.includes('Total CLF') && h.includes('Total GP')))) {
        loadDataset('vprp_entry');
        return;
      }
    } else if (isVoIndividual) {
      const allM = topic.allMonths || ['March 2026', 'February 2026', 'January 2026'];
      const defM = topic.defaultMonths || ['March 2026'];
      setAvailableMonths(allM);
      setSelectedMonths(defM);
      setColumns(generateVoIndividualColumns(defM));

      if (!currentHeaders.some(h => h.includes('VO Name') || h.includes('eBK Name'))) {
        loadDataset('t01_vo_individual');
        return;
      }
    } else if (isVo) {
      const allM = topic.allMonths || ['March 2026', 'February 2026', 'January 2026'];
      const defM = topic.defaultMonths || ['March 2026'];
      setAvailableMonths(allM);
      setSelectedMonths(defM);
      setColumns(generateVoColumns(defM));

      if (!currentHeaders.some(h => h.includes('Total VOs') || h.includes('CLF Name'))) {
        loadDataset('t01_vo_transactions');
        return;
      }
    } else if (isT01) {
      const allM = topic.allMonths || ['September 2026', 'August 2026', 'July 2026'];
      const defM = topic.defaultMonths || ['September 2026', 'August 2026'];
      setAvailableMonths(allM);
      setSelectedMonths(defM);
      setColumns(generateT01Columns(defM));

      if (!currentHeaders.some(h => h.includes('Total SHGs'))) {
        loadDataset('t01_transactions');
        return;
      }
    } else if (isEkyc) {
      const yDate = reportMeta.yesterdayDate || topic.yesterdayDate || '12-10-2026';
      const prevYDate = reportMeta.dayBeforeYesterdayDate || topic.dayBeforeYesterdayDate || '10-10-2026';
      setColumns(generateEkycColumns(yDate, prevYDate));

      if (currentHeaders.some(h => h.includes('Total SHGs') || h.includes('Total VOs') || h.includes('VO Name') || h.includes('Till March-23'))) {
        loadDataset('ekyc');
        return;
      }
    } else {
      setColumns(topic.columns || []);
      if (currentHeaders.some(h => h.includes('Total SHGs') || h.includes('Total VOs') || h.includes('VO Name') || h.includes('Till March-23'))) {
        loadDataset('ekyc');
        return;
      }
    }

    showToast(`Applied Topic: "${topic.topicName}"`);
  };

  // Load initial dataset (Kotwa S01 dataset, T01 SHG, T01 VO, or T01 VO Individual)
  const loadDataset = (key = 'ekyc') => {
    const sample = SAMPLE_DATASETS[key] || SAMPLE_DATASETS.ekyc;
    const rawHeaders = Object.keys(sample.data[0] || {});
    const stats = analyzeColumns(rawHeaders, sample.data);
    const defaultTopic = REPORT_TOPICS.find(t => t.id === sample.defaultPreset) || REPORT_TOPICS[0];

    if (key === 'lakhpati_didi_chakia') {
      setSelectedTargetBlockId('CHAKIA-PIPRA');
      const preset = savedBlockTargets['CHAKIA-PIPRA'];
      if (preset) {
        const gps = sample.data.map(r => r['Gram Panchayat']).filter(Boolean);
        setManualValues(prev => applyTargetPresetToManualValues(preset, prev, gps));
      }
    } else if (key === 'lakhpati_didi') {
      setSelectedTargetBlockId('KOTWA');
      const preset = savedBlockTargets['KOTWA'];
      if (preset) {
        const gps = sample.data.map(r => r['Gram Panchayat']).filter(Boolean);
        setManualValues(prev => applyTargetPresetToManualValues(preset, prev, gps));
      }
    } else if (key === 't01_vo_individual') {
      const voIndMonths = detectVoIndividualMonths(rawHeaders);
      const allM = voIndMonths.length > 0 ? voIndMonths : ['March 2026', 'February 2026', 'January 2026'];
      setAvailableMonths(allM);
      setSelectedMonths(['March 2026']);
    } else if (key === 't01_vo_transactions') {
      const voMonths = detectVoMonths(rawHeaders);
      const allM = voMonths.length > 0 ? voMonths : ['March 2026', 'February 2026', 'January 2026'];
      setAvailableMonths(allM);
      setSelectedMonths(['March 2026']);
    } else {
      const detected = detectT01Months(rawHeaders);
      if (detected.length > 0) {
        setAvailableMonths(detected);
        setSelectedMonths(detected.slice(0, 2));
      }
    }

    setFileInfo({
      filename: sample.filename,
      data: sample.data,
      headers: rawHeaders,
      columnStats: stats,
      sheetNames: ['Sheet1'],
      activeSheet: 'Sheet1',
      rawWorkbook: null
    });

    handleSelectTopic(defaultTopic.id, rawHeaders);
  };

  // Load on mount
  useEffect(() => {
    loadDataset('ekyc');
  }, []);

  // Handle local file upload
  const handleFileUpload = async (file) => {
    try {
      const parsed = await parseExcelFile(file);
      applyParsedData(parsed, file.name);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle pasted text
  const handlePasteData = (rawText) => {
    try {
      const parsed = parseRawText(rawText);
      applyParsedData(parsed, 'Pasted_Data.xlsx');
      showToast(`Pasted data loaded successfully (${parsed.data.length} records)!`);
    } catch (err) {
      showToast(`Paste failed: ${err.message}`, 'error');
    }
  };

  const applyParsedData = (parsed, displayName) => {
    setFileInfo(parsed);

    // Check if uploaded data is P01 SMC SHGs and Households
    const isP01Data = parsed.metadata?.reportType === 'p01_shg_households' ||
      parsed.headers.some(h => h.includes('Till March-23') || h.includes('Members in Cumulative') || h.includes('SHGs in Cumulative'));

    // Check if uploaded data is Lakhpati Didi / Aajeevika Register / A05 Income Report
    const isLakhpatiData = !isP01Data && (parsed.metadata?.reportType === 'lakhpati_didi' ||
      parsed.headers.some(h => /total \(unique count\)/i.test(h) || /aajeevika/i.test(h) || /potential lakhpati didi/i.test(h) || /active approved potential/i.test(h)));

    // Check if uploaded data is VPRP Entry Status Report
    const isVprpData = !isP01Data && !isLakhpatiData && (parsed.metadata?.reportType === 'vprp_entry' ||
      parsed.headers.some(h => /entitlement plan|livelihood plan|prepared ent|prepared lh/i.test(h)) ||
      (parsed.headers.some(h => /total clf/i.test(h)) && parsed.headers.some(h => /total gp/i.test(h))));

    // Check if uploaded data is VO Individual
    const isVoIndividualData = !isP01Data && !isLakhpatiData && !isVprpData && (parsed.metadata?.reportType === 't01_vo_individual' ||
      parsed.headers.some(h => h.includes('VO Name') || h.includes('eBK Name') || h.includes('Financial Intermediary')));

    // Check if uploaded data is VO transactions (CLF Wise)
    const isVoData = !isP01Data && !isLakhpatiData && !isVprpData && !isVoIndividualData && (parsed.metadata?.reportType === 't01_vo' ||
      parsed.headers.some(h => h.includes('Total VOs') || h.includes('CLF Name') || h.includes('VOs Financial-Intermediary')));

    // Check if uploaded data is T01 SHG
    const isT01Data = !isP01Data && !isLakhpatiData && !isVprpData && !isVoIndividualData && !isVoData && ((parsed.detectedMonths && parsed.detectedMonths.length > 0) ||
      parsed.headers.some(h => h.includes('Total SHGs') || h.includes('Transactions Captured')));

    if (isP01Data) {
      const pDate = parsed.detectedP01Date || '18-10-2026';
      const pPeriod = parsed.detectedP01Period || 'October-2026';

      setSelectedTopicId('p01_shg_households');
      setReportMeta(prev => ({
        ...prev,
        presetId: 'p01_shg_households',
        title: 'P01 - SMC - SHGs and Households',
        subtitle: 'P01 - SMC - SHGs and Households Panchayat: All Panchayats',
        district: parsed.metadata?.district || 'PURBI CHAMPARAN',
        companyName: `Block: ${parsed.metadata?.block || 'KOTWA'}`,
        panchayat: parsed.metadata?.panchayat || 'All Panchayats',
        dateLabel: `Date:-${pDate}`,
        currentDate: pDate,
        reportDate: pDate,
        period: pPeriod,
        theme: 'ekyc_olive',
        layoutType: 'p01_grid',
        sortByCol: `HHs On ${pDate}`,
        sortDir: 'desc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));

      setColumns(generateP01Columns(pDate, pPeriod));
    } else if (isLakhpatiData) {
      const detectedDate = parsed.metadata?.detectedDate || '21-10-2026';

      setSelectedTopicId('lakhpati_didi');
      const detectedBlock = parsed.metadata?.block || (parsed.data && parsed.data[0]?.Block) || '';
      const matchedPresetKey = matchBlockPreset(detectedBlock);
      const presetKeyToUse = matchedPresetKey || selectedTargetBlockId || 'KOTWA';
      const effectiveBlockName = (savedBlockTargets[presetKeyToUse]?.blockName) || parsed.metadata?.block || 'KOTWA';

      if (savedBlockTargets[presetKeyToUse]) {
        setSelectedTargetBlockId(presetKeyToUse);
        const preset = savedBlockTargets[presetKeyToUse];
        const uploadedGps = parsed.data.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean);
        setManualValues(prev => applyTargetPresetToManualValues(preset, prev, uploadedGps));
      }

      setReportMeta(prev => ({
        ...prev,
        presetId: 'lakhpati_didi',
        title: 'Lakhpati Didi Entry Status Report - (Q2 : Jul-sep), 2026-27',
        subtitle: 'Lakhpati Didi Entry Status Report - (Q2 : Jul-sep), 2026-27',
        district: (parsed.metadata?.district || 'PURBI CHAMPARAN').replace(/^District:\s*/i, '').replace(/\s+(?:Block|Panchayat|Date|Period|State):.*$/i, '').trim() || 'PURBI CHAMPARAN',
        companyName: `Block: ${effectiveBlockName || (parsed.metadata?.block || 'KOTWA').replace(/^Block:\s*/i, '').replace(/\s+(?:District|Panchayat|Date|Period|State):.*$/i, '').trim() || 'KOTWA'}`,
        panchayat: 'All Panchayats',
        dateLabel: `Date:-${detectedDate}`,
        currentDate: detectedDate,
        theme: 'lakhpati_yellow',
        layoutType: 'lakhpati_grid',
        sortByCol: 'Gap',
        sortDir: 'desc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));
      setColumns(generateLakhpatiColumns());
    } else if (isVprpData) {
      const detectedDate = parsed.metadata?.detectedDate || '22-10-2026';

      setSelectedTopicId('vprp_entry');
      setReportMeta(prev => ({
        ...prev,
        presetId: 'vprp_entry',
        title: `VPRP ENTRY STATUS REPORT, ${detectedDate}`,
        subtitle: 'VPRP Entry Status Report',
        district: (parsed.metadata?.district || 'PURBI CHAMPARAN').replace(/^District:\s*/i, '').replace(/\s+(?:Block|Panchayat|Date|Period|State):.*$/i, '').trim() || 'PURBI CHAMPARAN',
        companyName: `Block: ${(parsed.metadata?.block || 'KOTWA').replace(/^Block:\s*/i, '').replace(/\s+(?:District|Panchayat|Date|Period|State):.*$/i, '').trim() || 'KOTWA'}`,
        panchayat: 'All Panchayats',
        dateLabel: `Date:-${detectedDate}`,
        currentDate: detectedDate,
        theme: 'vprp_yellow',
        layoutType: 'vprp_grid',
        sortByCol: 'Entitlement Plan Gap',
        sortDir: 'desc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));
      setColumns(generateVprpColumns());
    } else if (isVoIndividualData) {
      const months = parsed.detectedMonths && parsed.detectedMonths.length > 0
        ? parsed.detectedMonths
        : detectVoIndividualMonths(parsed.headers);

      const allMonths = months.length > 0 ? months : ['March 2026', 'February 2026', 'January 2026'];
      const activeMonths = allMonths.includes('March 2026') ? ['March 2026'] : [allMonths[0]];
      setAvailableMonths(allMonths);
      setSelectedMonths(activeMonths);
      setSelectedTopicId('t01_vo_individual');

      setReportMeta(prev => ({
        ...prev,
        presetId: 't01_vo_individual',
        title: 'T01 - VO Transactions Monitoring Status',
        district: parsed.metadata?.district || 'PURBI CHAMPARAN',
        companyName: `Block: ${parsed.metadata?.block || 'KOTWA'}`,
        panchayat: '',
        dateLabel: 'Date:-12-10-2026',
        currentDate: '12-10-2026',
        theme: 'ekyc_olive',
        layoutType: 't01_vo_individual_grid',
        sortByCol: activeMonths[0] ? `${activeMonths[0]} - Transactions Captured` : '',
        sortDir: 'desc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));

      setColumns(generateVoIndividualColumns(activeMonths));
    } else if (isVoData) {
      const months = parsed.detectedMonths && parsed.detectedMonths.length > 0
        ? parsed.detectedMonths
        : detectVoMonths(parsed.headers);

      const allMonths = months.length > 0 ? months : ['March 2026', 'February 2026', 'January 2026'];
      const activeMonths = allMonths.includes('March 2026') ? ['March 2026'] : [allMonths[0]];
      setAvailableMonths(allMonths);
      setSelectedMonths(activeMonths);
      setSelectedTopicId('t01_vo_transactions');

      setReportMeta(prev => ({
        ...prev,
        presetId: 't01_vo_transactions',
        title: 'T01 - VO Transactions Monitoring Status',
        district: parsed.metadata?.district || 'PURBI CHAMPARAN',
        companyName: `Block: ${parsed.metadata?.block || 'KOTWA'}`,
        panchayat: '',
        dateLabel: 'Date:-13-10-2026',
        currentDate: '13-10-2026',
        theme: 'ekyc_olive',
        layoutType: 't01_vo_grid',
        sortByCol: activeMonths[0] ? `${activeMonths[0]} - Percentage` : '',
        sortDir: 'desc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));

      setColumns(generateVoColumns(activeMonths));
    } else if (isT01Data) {
      const months = parsed.detectedMonths && parsed.detectedMonths.length > 0
        ? parsed.detectedMonths
        : detectT01Months(parsed.headers);

      const activeMonths = months.length > 2 ? months.slice(0, 2) : months;
      setAvailableMonths(months);
      setSelectedMonths(activeMonths);
      setSelectedTopicId('t01_transactions');

      setReportMeta(prev => ({
        ...prev,
        presetId: 't01_transactions',
        title: 'T01 - SHG Transactions Monitoring Status',
        district: parsed.metadata?.district || 'PURBI CHAMPARAN',
        companyName: `Block: ${parsed.metadata?.block || 'KOTWA'}`,
        panchayat: parsed.metadata?.panchayat || 'All Panchayats',
        dateLabel: 'Date:-10-10-2026',
        currentDate: '10-10-2026',
        theme: 'ekyc_olive',
        layoutType: 't01_grid',
        sortByCol: activeMonths[1] ? `${activeMonths[1]} - Percentage (%)` : `${activeMonths[0]} - Percentage (%)`,
        sortDir: 'asc',
        downloadInfo: parsed.metadata?.downloadInfo || prev.downloadInfo
      }));

      setColumns(generateT01Columns(activeMonths));
    } else {
      if (parsed.metadata?.block) {
        setReportMeta(prev => ({
          ...prev,
          companyName: `Block: ${parsed.metadata.block}`
        }));
      }

      if (selectedTopicId === 'ekyc_progress') {
        const yDate = reportMeta.yesterdayDate || '12-10-2026';
        const prevYDate = reportMeta.dayBeforeYesterdayDate || '10-10-2026';
        setColumns(generateEkycColumns(yDate, prevYDate));
      } else {
        const currentTopic = REPORT_TOPICS.find(t => t.id === selectedTopicId) || REPORT_TOPICS[0];
        setColumns(currentTopic.columns || []);
      }
    }

    setActiveTab('report');
    showToast(`Loaded ${parsed.data.length} records from "${displayName}".`);
  };

  // Manual overrides for columns like "With e-KYC Adhaar 10-10-2026"
  const INITIAL_PREV_EKYC = {
    'MACHHARGAWA': 1516,
    'KARARIYA': 1534,
    'MAHARANI BHOPTA': 1252,
    'JASAULI': 1402,
    'KOTWA': 884,
    'AHIRAULIYA': 1301,
    'BHAHARWA KALA EAST': 1298,
    'BHOPATPUR NORTH': 904,
    'BHOPATPUR SOUTH': 1001,
    'JAGIRAHA': 679,
    'BATHANA': 1254,
    'GOPI CHHAPRA': 1686,
    'POKHARA': 1324,
    'DUMRA': 721,
    'JASAULI PATTI': 832,
    'BHAHARWA KALA WEST': 1027
  };

  const [manualValues, setManualValues] = useState(() => {
    let base = { ...INITIAL_PREV_EKYC };
    try {
      const saved = localStorage.getItem('manual_ekyc_prev_data');
      if (saved) {
        base = { ...base, ...JSON.parse(saved) };
      }
    } catch (e) {}

    // Initialize with default Kotwa targets
    const allPresets = getSavedBlockTargets();
    if (allPresets['KOTWA']) {
      base = applyTargetPresetToManualValues(allPresets['KOTWA'], base);
    }
    return base;
  });

  // Handle selecting a saved block target preset (e.g. KOTWA or CHAKIA-PIPRA)
  const handleSelectTargetBlock = (blockId) => {
    setSelectedTargetBlockId(blockId);
    const preset = savedBlockTargets[blockId];
    if (!preset) return;

    const currentGps = reportRows?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) ||
      fileInfo?.data?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) || [];

    setManualValues(prev => {
      const updated = applyTargetPresetToManualValues(preset, prev, currentGps);
      try {
        localStorage.setItem('manual_ekyc_prev_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setReportMeta(prev => ({
      ...prev,
      companyName: `Block: ${preset.blockName || blockId}`,
      district: preset.district || prev.district || 'PURBI CHAMPARAN'
    }));

    showToast(`Applied "${preset.blockName || blockId}" targets (Total: ${Number(preset.totalTarget || 0).toLocaleString('en-IN')})`);
  };

  // Handle applying target preset from TargetPresetModal
  const handleApplyTargetPreset = (presetData) => {
    if (!presetData || !presetData.blockId) return;
    const allUpdated = getSavedBlockTargets();
    setSavedBlockTargets(allUpdated);
    setSelectedTargetBlockId(presetData.blockId);

    const currentGps = reportRows?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) ||
      fileInfo?.data?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) || [];

    setManualValues(prev => {
      const updated = applyTargetPresetToManualValues(presetData, prev, currentGps);
      try {
        localStorage.setItem('manual_ekyc_prev_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    setReportMeta(prev => ({
      ...prev,
      companyName: `Block: ${presetData.blockName || presetData.blockId}`,
      district: presetData.district || prev.district || 'PURBI CHAMPARAN'
    }));

    showToast(`Saved and applied "${presetData.blockName}" target preset!`);
  };

  const handleSaveManualValues = (newValues) => {
    setManualValues(newValues);
    try {
      localStorage.setItem('manual_ekyc_prev_data', JSON.stringify(newValues));
    } catch (e) {}
    showToast('Updated previous day e-KYC values & recalculated progress!');
  };

  const handleUpdateSingleManualValue = (gpName, val, colKey = null) => {
    setManualValues(prev => {
      const keyToUse = colKey ? `${colKey}_${gpName}` : gpName;
      const updated = { ...prev, [keyToUse]: val === '' ? '' : Number(val) };
      try {
        localStorage.setItem('manual_ekyc_prev_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Reactive calculation of report rows & totals
  const { reportRows, totals } = useMemo(() => {
    if (!fileInfo || !fileInfo.data) return { reportRows: [], totals: {} };
    const { rows, totals: calculatedTotals } = generateReportData(
      fileInfo.data,
      columns,
      reportMeta.groupBy,
      reportMeta.sortByCol,
      reportMeta.sortDir,
      manualValues
    );
    return { reportRows: rows, totals: calculatedTotals };
  }, [fileInfo, columns, reportMeta.groupBy, reportMeta.sortByCol, reportMeta.sortDir, manualValues]);

  // Handle Excel Export (.xlsx)
  const handleExportExcel = async () => {
    if (!reportRows || reportRows.length === 0) {
      showToast('No report data to export.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      const cleanTitle = (reportMeta.title || 'eKYC_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      await exportToStyledExcel({
        reportMeta,
        columns,
        rows: reportRows,
        totals,
        filename: `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
      showToast('Styled Excel (.xlsx) downloaded successfully!');
    } catch (err) {
      showToast(`Export failed: ${err.message}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    if (!reportRows || reportRows.length === 0) return;
    try {
      const cleanTitle = (reportMeta.title || 'eKYC_Report').replace(/[^a-zA-Z0-9_-]/g, '_');
      exportToCSV({
        columns,
        rows: reportRows,
        filename: `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.csv`
      });
      showToast('CSV report exported successfully!');
    } catch (err) {
      showToast(`CSV export failed: ${err.message}`, 'error');
    }
  };

  const hasData = Boolean(fileInfo && fileInfo.data && fileInfo.data.length > 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom duration-200 border bg-white text-slate-800 border-slate-200">
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasData={hasData}
        onLoadSample={loadDataset}
        onExportExcel={handleExportExcel}
        isExporting={isExporting}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Fast Report Generator Bar (Designed for New Staff) */}
        <FastReportGenerator
          selectedTopicId={selectedTopicId}
          onSelectTopic={handleSelectTopic}
          onFileUpload={handleFileUpload}
          onPasteData={handlePasteData}
          onExportExcel={handleExportExcel}
          isExporting={isExporting}
          reportMeta={reportMeta}
          setReportMeta={setReportMeta}
          onEkycDateChange={handleEkycDateChange}
          rowCount={fileInfo?.data?.length || 0}
          fileName={fileInfo?.filename}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          availableMonths={availableMonths}
          selectedMonths={selectedMonths}
          onToggleMonth={handleToggleMonth}
          selectedTargetBlockId={selectedTargetBlockId}
          onSelectTargetBlock={handleSelectTargetBlock}
          savedBlockTargets={savedBlockTargets}
          onOpenTargetModal={() => setShowTargetModal(true)}
        />

        {/* Display Views */}
        {hasData && (
          <div>
            {activeTab === 'report' && (
              <ReportViewer
                reportMeta={reportMeta}
                columns={columns}
                rows={reportRows}
                totals={totals}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                isExporting={isExporting}
                manualValues={manualValues}
                onSaveManualValues={handleSaveManualValues}
                onUpdateSingleManualValue={handleUpdateSingleManualValue}
                selectedTargetBlockId={selectedTargetBlockId}
                onSelectTargetBlock={handleSelectTargetBlock}
                savedBlockTargets={savedBlockTargets}
                onOpenTargetModal={() => setShowTargetModal(true)}
              />
            )}

            {activeTab === 'raw' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-800">
                    Raw Data Source Preview
                  </h2>
                  <span className="text-xs text-slate-500">
                    {fileInfo.data.length} Panchayats (Rows 5 to 20) • {fileInfo.headers.length} columns
                  </span>
                </div>
                <RawDataViewer
                  headers={fileInfo.headers}
                  data={fileInfo.data}
                  columnStats={fileInfo.columnStats}
                  portalTotals={fileInfo.portalTotals}
                  totalRowIndex={fileInfo.totalRowIndex || 4}
                  dataStartRow={fileInfo.dataStartRowIndex || 5}
                />
              </div>
            )}

            {activeTab === 'split' && (
              <SplitView
                headers={fileInfo.headers}
                rawData={fileInfo.data}
                columnStats={fileInfo.columnStats}
                portalTotals={fileInfo.portalTotals}
                totalRowIndex={fileInfo.totalRowIndex || 4}
                dataStartRowIndex={fileInfo.dataStartRowIndex || 5}
                reportMeta={reportMeta}
                columns={columns}
                reportRows={reportRows}
                totals={totals}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                isExporting={isExporting}
                manualValues={manualValues}
                onSaveManualValues={handleSaveManualValues}
                onUpdateSingleManualValue={handleUpdateSingleManualValue}
                selectedTargetBlockId={selectedTargetBlockId}
                onSelectTargetBlock={handleSelectTargetBlock}
                savedBlockTargets={savedBlockTargets}
                onOpenTargetModal={() => setShowTargetModal(true)}
              />
            )}

            {activeTab === 'builder' && (
              <ReportConfig
                rawHeaders={fileInfo.headers}
                sampleRow={fileInfo.data[0] || {}}
                reportMeta={reportMeta}
                setReportMeta={setReportMeta}
                columns={columns}
                setColumns={setColumns}
              />
            )}
          </div>
        )}
      </main>

      {/* Lakhpati Target Presets Modal */}
      <TargetPresetModal
        isOpen={showTargetModal}
        onClose={() => setShowTargetModal(false)}
        currentBlockId={selectedTargetBlockId}
        onApplyTargets={handleApplyTargetPreset}
        currentPanchayats={
          reportRows?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) ||
          fileInfo?.data?.map(r => r['Gram Panchayat'] || r.GramPanchayat).filter(Boolean) ||
          []
        }
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Excel Report Studio</span>
            <span>—</span>
            <span>Instant S01 Member KYC & e-KYC Report Generator</span>
          </div>
          <div className="text-slate-400">
            Local browser processing • 100% Confidential
          </div>
        </div>
      </footer>
    </div>
  );
}
