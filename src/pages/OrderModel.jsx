import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  StarIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { normalizePaginatedResponse } from '../services/apiResponseUtils';
import { collaborationAPI } from '../services/endpoints';
import { useLanguage } from '../hooks/useLanguage';

const PAGE_SIZE = 10;
const TAB_OPTIONS = ['discover', 'requests', 'agreements'];
const COLLABORATION_TYPES = ['PHOTO_SHOOT', 'FASHION_SHOW', 'PRODUCT_MODELING', 'SOCIAL_MEDIA_CONTENT', 'BRAND_CAMPAIGN', 'VIDEO_SHOOT'];
const REQUEST_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const AGREEMENT_STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'REVISION_REQUESTED', 'AWAITING_PAYMENT', 'COMPLETED', 'CANCELLED'];

const money = (value) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const toDateTimeLocalValue = (date) => {
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return localDate.toISOString().slice(0, 16);
};

const getApiErrorMessage = (error, fallbackMessage) => {
  const responseData = error?.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  return responseData?.message || error?.message || fallbackMessage;
};

const requestStatusTone = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  EXPIRED: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200',
};

const agreementStatusTone = {
  IN_PROGRESS: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200',
  SUBMITTED: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200',
  REVISION_REQUESTED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
  AWAITING_PAYMENT: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
};

const bodyTypeLabel = (value) => String(value || '').replaceAll('_', ' ');
const availabilityLabel = (value) => String(value || '').replaceAll('_', ' ');

const createDefaultRequestForm = () => ({
  availableFor: 'BRAND_CAMPAIGN',
  title: '',
  description: '',
  proposedPrice: '',
  deadline: toDateTimeLocalValue(new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))),
  location: '',
});

const createDefaultPaymentForm = () => ({
  providerPaymentId: '',
  transactionReference: '',
  failureReason: '',
});

const createDefaultReviewForm = () => ({
  stars: 5,
  comment: '',
});

const baseCardClass = 'rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900';

const OrderModel = () => {
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const reviewSectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState('discover');
  const [modelPage, setModelPage] = useState(0);
  const [requestPage, setRequestPage] = useState(0);
  const [agreementPage, setAgreementPage] = useState(0);
  const [modelSearch, setModelSearch] = useState('');
  const [modelSearchInput, setModelSearchInput] = useState('');
  const [modelAvailabilityFilter, setModelAvailabilityFilter] = useState('');
  const [availabilityState, setAvailabilityState] = useState('all');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [agreementStatusFilter, setAgreementStatusFilter] = useState('all');
  const [selectedModel, setSelectedModel] = useState(null);
  const [requestForm, setRequestForm] = useState(createDefaultRequestForm());
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [selectedAgreementId, setSelectedAgreementId] = useState('');
  const [revisionDrafts, setRevisionDrafts] = useState({});
  const [paymentForm, setPaymentForm] = useState(createDefaultPaymentForm());
  const [reviewForm, setReviewForm] = useState(createDefaultReviewForm());
  const routeAgreementId = searchParams.get('agreementId') || '';
  const routeSection = searchParams.get('section') || '';

  const ui = language === 'ar'
    ? {
      title: 'Model Collaboration',
      subtitle: 'Search models, send collaboration requests, review submissions, complete payment, and leave a review from one workspace.',
      discover: 'Discover Models',
      requests: 'Requests',
      agreements: 'Agreements',
      searchModels: 'Search models by name, email, or city',
      refresh: 'Refresh',
      noModels: 'No models match the current filters.',
      noRequests: 'No requests returned for this filter.',
      noAgreements: 'No agreements returned for this filter.',
      sendRequest: 'Send request',
      close: 'Close',
      open: 'Open',
      cancelRequest: 'Cancel request',
      submitRequest: 'Submit request',
      submitting: 'Submitting...',
      deadline: 'Deadline',
      proposedPrice: 'Proposed price',
      location: 'Location',
      optional: 'Optional',
      note: 'Note',
      feedback: 'Feedback',
      approve: 'Approve submission',
      requestRevision: 'Request revision',
      payment: 'Payment',
      markSuccess: 'Mark payment success',
      markFailure: 'Mark payment failure',
      review: 'Review',
      saveReview: 'Save review',
      updating: 'Updating...',
      noSubmissions: 'No submissions yet for this agreement.',
      noReviewYet: 'No review submitted yet.',
      stars: 'Stars',
      comment: 'Comment',
      providerPaymentId: 'Provider payment id',
      transactionReference: 'Transaction reference',
      failureReason: 'Failure reason',
    }
    : {
      title: 'Model Collaboration',
      subtitle: 'Search models, send collaboration requests, review submissions, complete payment, and leave a review from one workspace.',
      discover: 'Discover Models',
      requests: 'Requests',
      agreements: 'Agreements',
      searchModels: 'Search models by name, email, or city',
      refresh: 'Refresh',
      noModels: 'No models match the current filters.',
      noRequests: 'No requests returned for this filter.',
      noAgreements: 'No agreements returned for this filter.',
      sendRequest: 'Send request',
      close: 'Close',
      open: 'Open',
      cancelRequest: 'Cancel request',
      submitRequest: 'Submit request',
      submitting: 'Submitting...',
      deadline: 'Deadline',
      proposedPrice: 'Proposed price',
      location: 'Location',
      optional: 'Optional',
      note: 'Note',
      feedback: 'Feedback',
      approve: 'Approve submission',
      requestRevision: 'Request revision',
      payment: 'Payment',
      markSuccess: 'Mark payment success',
      markFailure: 'Mark payment failure',
      review: 'Review',
      saveReview: 'Save review',
      updating: 'Updating...',
      noSubmissions: 'No submissions yet for this agreement.',
      noReviewYet: 'No review submitted yet.',
      stars: 'Stars',
      comment: 'Comment',
      providerPaymentId: 'Provider payment id',
      transactionReference: 'Transaction reference',
      failureReason: 'Failure reason',
    };

  const modelsQuery = useQuery({
    queryKey: ['brand-collaboration-models', modelPage, modelSearch, modelAvailabilityFilter, availabilityState],
    queryFn: async () => {
      const response = await collaborationAPI.searchModels({
        page: modelPage,
        size: PAGE_SIZE,
        search: modelSearch.trim(),
        availableFor: modelAvailabilityFilter,
        isAvailable: availabilityState === 'all' ? undefined : availabilityState === 'available',
      });

      return normalizePaginatedResponse(response.data, { fallbackPage: modelPage, fallbackSize: PAGE_SIZE });
    },
  });

  const requestsQuery = useQuery({
    queryKey: ['brand-collaboration-requests', requestPage, requestStatusFilter],
    queryFn: async () => {
      const response = await collaborationAPI.getRequests({
        page: requestPage,
        size: PAGE_SIZE,
        status: requestStatusFilter === 'all' ? '' : requestStatusFilter,
      });

      return normalizePaginatedResponse(response.data, { fallbackPage: requestPage, fallbackSize: PAGE_SIZE });
    },
  });

  const agreementsQuery = useQuery({
    queryKey: ['brand-collaboration-agreements', agreementPage, agreementStatusFilter],
    queryFn: async () => {
      const response = await collaborationAPI.getAgreements({
        page: agreementPage,
        size: PAGE_SIZE,
        status: agreementStatusFilter === 'all' ? '' : agreementStatusFilter,
      });

      return normalizePaginatedResponse(response.data, { fallbackPage: agreementPage, fallbackSize: PAGE_SIZE });
    },
  });

  const requestDetailQuery = useQuery({
    queryKey: ['brand-collaboration-request-detail', selectedRequestId],
    enabled: Boolean(selectedRequestId),
    queryFn: async () => {
      const response = await collaborationAPI.getRequestById(selectedRequestId);
      return response.data || null;
    },
  });

  const agreementDetailQuery = useQuery({
    queryKey: ['brand-collaboration-agreement-detail', selectedAgreementId],
    enabled: Boolean(selectedAgreementId),
    queryFn: async () => {
      const response = await collaborationAPI.getAgreementById(selectedAgreementId);
      return response.data || null;
    },
  });

  const submissionsQuery = useQuery({
    queryKey: ['brand-collaboration-agreement-submissions', selectedAgreementId],
    enabled: Boolean(selectedAgreementId),
    queryFn: async () => {
      const response = await collaborationAPI.getSubmissions(selectedAgreementId);
      return response.data || [];
    },
  });

  const paymentQuery = useQuery({
    queryKey: ['brand-collaboration-agreement-payment', selectedAgreementId],
    enabled: Boolean(selectedAgreementId),
    queryFn: async () => {
      const response = await collaborationAPI.getPayment(selectedAgreementId);
      return response.data || null;
    },
  });

  const reviewQuery = useQuery({
    queryKey: ['brand-collaboration-agreement-review', selectedAgreementId],
    enabled: Boolean(selectedAgreementId),
    queryFn: async () => {
      const response = await collaborationAPI.getReview(selectedAgreementId);
      return response.data || null;
    },
  });

  const invalidateCollaboration = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-models'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-requests'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-request-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-agreements'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-agreement-detail'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-agreement-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-agreement-payment'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-collaboration-agreement-review'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-dashboard-home'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['brand-notification-stats'] }),
    ]);
  };

  const createRequestMutation = useMutation({
    mutationFn: ({ modelId, body }) => collaborationAPI.createRequest(modelId, body),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Collaboration request sent');
      setSelectedModel(null);
      setRequestForm(createDefaultRequestForm());
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to send collaboration request'));
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId) => collaborationAPI.cancelRequest(requestId),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Request cancelled');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to cancel request'));
    },
  });

  const approveSubmissionMutation = useMutation({
    mutationFn: ({ agreementId, submissionId }) => collaborationAPI.approveSubmission(agreementId, submissionId),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Submission approved');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to approve submission'));
    },
  });

  const requestRevisionMutation = useMutation({
    mutationFn: ({ agreementId, submissionId, feedback }) => collaborationAPI.requestRevision(agreementId, submissionId, feedback),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Revision request sent');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to request revision'));
    },
  });

  const paymentSuccessMutation = useMutation({
    mutationFn: ({ agreementId, body }) => collaborationAPI.markPaymentSuccess(agreementId, body),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Payment marked as successful');
      setPaymentForm(createDefaultPaymentForm());
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update payment'));
    },
  });

  const paymentFailureMutation = useMutation({
    mutationFn: ({ agreementId, body }) => collaborationAPI.markPaymentFailure(agreementId, body),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Payment marked as failed');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to update payment'));
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ agreementId, body }) => collaborationAPI.saveReview(agreementId, body),
    onSuccess: async () => {
      await invalidateCollaboration();
      toast.success('Review saved');
      setReviewForm(createDefaultReviewForm());
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Failed to save review'));
    },
  });

  const models = modelsQuery.data?.items || [];
  const requests = requestsQuery.data?.items || [];
  const agreements = agreementsQuery.data?.items || [];
  const selectedRequest = requestDetailQuery.data;
  const selectedAgreement = agreementDetailQuery.data;
  const submissions = submissionsQuery.data || [];
  const payment = paymentQuery.data;
  const review = reviewQuery.data;

  const collaborationStats = useMemo(() => ({
    discoverable: modelsQuery.data?.totalElements ?? 0,
    sentRequests: requestsQuery.data?.totalElements ?? 0,
    activeAgreements: agreementsQuery.data?.totalElements ?? 0,
    awaitingPayment: agreements.filter((agreement) => agreement.agreementStatus === 'AWAITING_PAYMENT').length,
  }), [agreements, agreementsQuery.data?.totalElements, modelsQuery.data?.totalElements, requestsQuery.data?.totalElements]);

  useEffect(() => {
    if (!routeAgreementId) {
      return;
    }

    setActiveTab('agreements');
    setSelectedAgreementId((current) => (current === routeAgreementId ? current : routeAgreementId));
  }, [routeAgreementId]);

  useEffect(() => {
    if (
      routeSection !== 'review'
      || !routeAgreementId
      || agreementDetailQuery.isLoading
      || !selectedAgreement
    ) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      reviewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timerId);
  }, [agreementDetailQuery.isLoading, routeAgreementId, routeSection, selectedAgreement]);

  const setAgreementRouteState = (agreementId, section = '') => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('agreementId', agreementId);

    if (section) {
      nextSearchParams.set('section', section);
    } else {
      nextSearchParams.delete('section');
    }

    setSearchParams(nextSearchParams);
  };

  const clearAgreementRouteState = () => {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('agreementId');
    nextSearchParams.delete('section');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const openRequestDrawer = (requestId) => {
    setSelectedRequestId(requestId);
  };

  const openAgreementDrawer = (agreementId, section = '') => {
    setActiveTab('agreements');
    setSelectedAgreementId(agreementId);
    setAgreementRouteState(agreementId, section);
  };

  const handleRequestSubmit = () => {
    if (!selectedModel?.modelId) {
      toast.error('Choose a model first');
      return;
    }

    if (!requestForm.title.trim() || !requestForm.description.trim() || !requestForm.proposedPrice || !requestForm.deadline) {
      toast.error('Fill the title, description, proposed price, and deadline');
      return;
    }

    createRequestMutation.mutate({
      modelId: selectedModel.modelId,
      body: {
        availableFor: requestForm.availableFor,
        title: requestForm.title.trim(),
        description: requestForm.description.trim(),
        proposedPrice: Number(requestForm.proposedPrice),
        deadline: new Date(requestForm.deadline).toISOString(),
        location: requestForm.location.trim() || null,
      },
    });
  };

  const handleMarkPaymentSuccess = () => {
    if (!selectedAgreementId) {
      return;
    }

    paymentSuccessMutation.mutate({
      agreementId: selectedAgreementId,
      body: {
        paymentMethod: 'CARD',
        provider: 'FAKE',
        providerPaymentId: paymentForm.providerPaymentId.trim() || `fake-${Date.now()}`,
        transactionReference: paymentForm.transactionReference.trim() || `txn-${Date.now()}`,
      },
    });
  };

  const handleMarkPaymentFailure = () => {
    if (!selectedAgreementId) {
      return;
    }

    if (!paymentForm.failureReason.trim()) {
      toast.error('Add a failure reason first');
      return;
    }

    paymentFailureMutation.mutate({
      agreementId: selectedAgreementId,
      body: {
        paymentMethod: 'CARD',
        provider: 'FAKE',
        providerPaymentId: paymentForm.providerPaymentId.trim() || `fake-${Date.now()}`,
        transactionReference: paymentForm.transactionReference.trim() || `txn-${Date.now()}`,
        failureReason: paymentForm.failureReason.trim(),
      },
    });
  };

  const handleSaveReview = () => {
    if (!selectedAgreementId) {
      return;
    }

    if (!reviewForm.comment.trim()) {
      toast.error('Add a short review comment');
      return;
    }

    reviewMutation.mutate({
      agreementId: selectedAgreementId,
      body: {
        stars: Number(reviewForm.stars),
        comment: reviewForm.comment.trim(),
      },
    });
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[var(--brand-primary-soft)]/40 p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[var(--brand-primary)]">Brand collaboration</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{ui.title}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{ui.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={() => invalidateCollaboration()}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ArrowPathIcon className="h-5 w-5" />
            {ui.refresh}
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={UserGroupIcon} label="Discoverable models" value={collaborationStats.discoverable} />
        <StatCard icon={ClipboardDocumentListIcon} label="Sent requests" value={collaborationStats.sentRequests} />
        <StatCard icon={CheckCircleIcon} label="Agreements" value={collaborationStats.activeAgreements} />
        <StatCard icon={BanknotesIcon} label="Awaiting payment" value={collaborationStats.awaitingPayment} />
      </section>

      <section className={baseCardClass}>
        <div className="flex flex-wrap gap-2">
          {TAB_OPTIONS.map((tab) => {
            const label = tab === 'discover' ? ui.discover : tab === 'requests' ? ui.requests : ui.agreements;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-[var(--brand-primary)] text-white'
                    : 'border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === 'discover' && (
        <section className="space-y-6">
          <section className={baseCardClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
              <div className="relative">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={modelSearchInput}
                  onChange={(event) => setModelSearchInput(event.target.value)}
                  placeholder={ui.searchModels}
                  className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <select
                value={modelAvailabilityFilter}
                onChange={(event) => {
                  setModelAvailabilityFilter(event.target.value);
                  setModelPage(0);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="">All services</option>
                {COLLABORATION_TYPES.map((option) => (
                  <option key={option} value={option}>{availabilityLabel(option)}</option>
                ))}
              </select>
              <select
                value={availabilityState}
                onChange={(event) => {
                  setAvailabilityState(event.target.value);
                  setModelPage(0);
                }}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                <option value="all">All availability</option>
                <option value="available">Available only</option>
                <option value="unavailable">Unavailable only</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setModelSearch(modelSearchInput);
                  setModelPage(0);
                }}
                className="rounded-2xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white"
              >
                Search
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modelsQuery.isLoading ? (
              <div className={`${baseCardClass} md:col-span-2 xl:col-span-3 text-sm text-slate-500 dark:text-slate-400`}>Loading models...</div>
            ) : models.length === 0 ? (
              <div className={`${baseCardClass} md:col-span-2 xl:col-span-3 text-sm text-slate-500 dark:text-slate-400`}>{ui.noModels}</div>
            ) : models.map((model) => (
              <article key={model.modelId} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                  {model.profileImage ? (
                    <img src={model.profileImage} alt={model.modelName} className="h-16 w-16 rounded-2xl object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-200">
                      {(model.modelName || 'M').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-slate-950 dark:text-white">{model.modelName}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${model.isAvailable ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                        {model.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{model.modelEmail}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      <span>{model.city || 'City not set'}</span>
                      <span>{model.age || '-'} yrs</span>
                      <span>{model.heightCm || '-'} cm</span>
                      <span>{model.weightKg || '-'} kg</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <MiniStat label="Body type" value={bodyTypeLabel(model.bodyType) || '-'} />
                  <MiniStat label="Skin tone" value={bodyTypeLabel(model.skinTone) || '-'} />
                  <MiniStat label="Hair color" value={model.hairColor || '-'} />
                  <MiniStat label="Rating" value={`${Number(model.ratingAvg || 0).toFixed(1)} (${model.ratingCount || 0})`} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(model.availableFor || []).map((entry) => (
                    <span key={`${model.modelId}-${entry.availableFor}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {availabilityLabel(entry.availableFor)}: {money(entry.pricePerSession)}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedModel(model);
                    setRequestForm({
                      ...createDefaultRequestForm(),
                      availableFor: model.availableFor?.[0]?.availableFor || 'BRAND_CAMPAIGN',
                    });
                  }}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {ui.sendRequest}
                </button>
              </article>
            ))}
          </section>

          {(modelsQuery.data?.items?.length || 0) > 0 && (
            <PaginationBar pageData={modelsQuery.data} onPrevious={() => setModelPage((current) => Math.max(current - 1, 0))} onNext={() => setModelPage((current) => current + 1)} />
          )}
        </section>
      )}

      {activeTab === 'requests' && (
        <section className="space-y-6">
          <section className={baseCardClass}>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setRequestStatusFilter('all');
                  setRequestPage(0);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${requestStatusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
              >
                All
              </button>
              {REQUEST_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setRequestStatusFilter(status);
                    setRequestPage(0);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${requestStatusFilter === status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className={baseCardClass}>
            {requestsQuery.isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading requests...</p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noRequests}</p>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <article key={request.requestId} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950 dark:text-white">{request.requestNumber}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${requestStatusTone[request.requestStatus] || requestStatusTone.PENDING}`}>
                            {request.requestStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{request.modelName} • {request.modelEmail}</p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{request.title}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{availabilityLabel(request.availableFor)}</span>
                          <span>{money(request.proposedPrice)}</span>
                          <span>{formatDateTime(request.deadline)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openRequestDrawer(request.requestId)}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        >
                          {ui.open}
                        </button>
                        {request.requestStatus === 'PENDING' && (
                          <button
                            type="button"
                            disabled={cancelRequestMutation.isPending}
                            onClick={() => cancelRequestMutation.mutate(request.requestId)}
                            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-900"
                          >
                            {ui.cancelRequest}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {(requestsQuery.data?.items?.length || 0) > 0 && (
            <PaginationBar pageData={requestsQuery.data} onPrevious={() => setRequestPage((current) => Math.max(current - 1, 0))} onNext={() => setRequestPage((current) => current + 1)} />
          )}
        </section>
      )}

      {activeTab === 'agreements' && (
        <section className="space-y-6">
          <section className={baseCardClass}>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setAgreementStatusFilter('all');
                  setAgreementPage(0);
                }}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${agreementStatusFilter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
              >
                All
              </button>
              {AGREEMENT_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setAgreementStatusFilter(status);
                    setAgreementPage(0);
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${agreementStatusFilter === status ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950' : 'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <section className={baseCardClass}>
            {agreementsQuery.isLoading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading agreements...</p>
            ) : agreements.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noAgreements}</p>
            ) : (
              <div className="space-y-4">
                {agreements.map((agreement) => (
                  <article key={agreement.agreementId} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-950 dark:text-white">{agreement.agreementNumber}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agreementStatusTone[agreement.agreementStatus] || agreementStatusTone.IN_PROGRESS}`}>
                            {agreement.agreementStatus}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{agreement.modelName} • {agreement.modelEmail}</p>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{agreement.title}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{availabilityLabel(agreement.availableFor)}</span>
                          <span>{money(agreement.agreedPrice)}</span>
                          <span>{agreement.paymentStatus}</span>
                          <span>{formatDateTime(agreement.deadline)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openAgreementDrawer(agreement.agreementId)}
                        className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        {ui.open}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {(agreementsQuery.data?.items?.length || 0) > 0 && (
            <PaginationBar pageData={agreementsQuery.data} onPrevious={() => setAgreementPage((current) => Math.max(current - 1, 0))} onNext={() => setAgreementPage((current) => current + 1)} />
          )}
        </section>
      )}

      <SlideOver
        isOpen={Boolean(selectedModel)}
        onClose={() => {
          setSelectedModel(null);
          setRequestForm(createDefaultRequestForm());
        }}
        title={selectedModel ? `Request ${selectedModel.modelName}` : ui.sendRequest}
      >
        {selectedModel && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
              <p className="font-semibold text-slate-950 dark:text-white">{selectedModel.modelName}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selectedModel.modelEmail}</p>
            </div>

            <Field label="Available for">
              <select
                value={requestForm.availableFor}
                onChange={(event) => setRequestForm((current) => ({ ...current, availableFor: event.target.value }))}
                className={inputClassName}
              >
                {COLLABORATION_TYPES.map((option) => (
                  <option key={option} value={option}>{availabilityLabel(option)}</option>
                ))}
              </select>
            </Field>

            <Field label="Title">
              <input
                value={requestForm.title}
                onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))}
                className={inputClassName}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={4}
                value={requestForm.description}
                onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))}
                className={textareaClassName}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={ui.proposedPrice}>
                <input
                  type="number"
                  min="0"
                  value={requestForm.proposedPrice}
                  onChange={(event) => setRequestForm((current) => ({ ...current, proposedPrice: event.target.value }))}
                  className={inputClassName}
                />
              </Field>
              <Field label={ui.deadline}>
                <input
                  type="datetime-local"
                  value={requestForm.deadline}
                  onChange={(event) => setRequestForm((current) => ({ ...current, deadline: event.target.value }))}
                  className={inputClassName}
                />
              </Field>
            </div>

            <Field label={`${ui.location} (${ui.optional})`}>
              <input
                value={requestForm.location}
                onChange={(event) => setRequestForm((current) => ({ ...current, location: event.target.value }))}
                className={inputClassName}
              />
            </Field>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={createRequestMutation.isPending}
                onClick={handleRequestSubmit}
                className="rounded-xl bg-[var(--brand-primary)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {createRequestMutation.isPending ? ui.submitting : ui.submitRequest}
              </button>
            </div>
          </div>
        )}
      </SlideOver>

      <SlideOver
        isOpen={Boolean(selectedRequestId)}
        onClose={() => setSelectedRequestId('')}
        title={selectedRequest?.requestNumber || 'Request details'}
      >
        {requestDetailQuery.isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading request details...</p>
        ) : !selectedRequest ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No request details available.</p>
        ) : (
          <div className="space-y-4">
            <DetailRow label="Model" value={`${selectedRequest.modelName} (${selectedRequest.modelEmail})`} />
            <DetailRow label="Status" value={selectedRequest.requestStatus} />
            <DetailRow label="Type" value={availabilityLabel(selectedRequest.availableFor)} />
            <DetailRow label="Title" value={selectedRequest.title} />
            <DetailRow label="Description" value={selectedRequest.description} />
            <DetailRow label="Price" value={money(selectedRequest.proposedPrice)} />
            <DetailRow label="Deadline" value={formatDateTime(selectedRequest.deadline)} />
            <DetailRow label="Location" value={selectedRequest.location || 'Not provided'} />
            <DetailRow label="Rejected because" value={selectedRequest.rejectionReason || 'No rejection reason'} />
            <DetailRow label="Created" value={formatDateTime(selectedRequest.createdAt)} />
            <DetailRow label="Responded" value={formatDateTime(selectedRequest.respondedAt)} />
            {selectedRequest.requestStatus === 'PENDING' && (
              <button
                type="button"
                disabled={cancelRequestMutation.isPending}
                onClick={() => cancelRequestMutation.mutate(selectedRequest.requestId)}
                className="mt-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:opacity-50 dark:border-rose-900"
              >
                {ui.cancelRequest}
              </button>
            )}
          </div>
        )}
      </SlideOver>

      <SlideOver
        isOpen={Boolean(selectedAgreementId)}
        onClose={() => {
          setSelectedAgreementId('');
          setPaymentForm(createDefaultPaymentForm());
          setReviewForm(createDefaultReviewForm());
          setRevisionDrafts({});
          clearAgreementRouteState();
        }}
        title={selectedAgreement?.agreementNumber || 'Agreement workspace'}
        wide
      >
        {agreementDetailQuery.isLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading agreement workspace...</p>
        ) : !selectedAgreement ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No agreement details available.</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoCard label="Model" value={selectedAgreement.modelName} />
              <InfoCard label="Status" value={selectedAgreement.agreementStatus} />
              <InfoCard label="Payment" value={selectedAgreement.paymentStatus} />
              <InfoCard label="Agreed price" value={money(selectedAgreement.agreedPrice)} />
            </div>

            <section className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Agreement summary</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
                <DetailRow label="Request" value={selectedAgreement.requestNumber} />
                <DetailRow label="Type" value={availabilityLabel(selectedAgreement.availableFor)} />
                <DetailRow label="Title" value={selectedAgreement.title} />
                <DetailRow label="Description" value={selectedAgreement.description} />
                <DetailRow label="Deadline" value={formatDateTime(selectedAgreement.deadline)} />
                <DetailRow label="Location" value={selectedAgreement.location || 'Not provided'} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Submissions</h3>
              <div className="mt-4 space-y-4">
                {submissionsQuery.isLoading ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Loading submissions...</p>
                ) : submissions.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noSubmissions}</p>
                ) : submissions.map((submission) => (
                  <article key={submission.submissionId} className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-950 dark:text-white">{submission.submissionId}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {submission.reviewStatus} • {formatDateTime(submission.createdAt)}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agreementStatusTone[submission.reviewStatus === 'APPROVED' ? 'COMPLETED' : submission.reviewStatus === 'REVISION_REQUESTED' ? 'REVISION_REQUESTED' : 'SUBMITTED']}`}>
                        {submission.reviewStatus}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{submission.note || 'No note included.'}</p>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{submission.reviewFeedback || 'No review feedback yet.'}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {(submission.assets || []).map((asset) => (
                        <div key={asset.assetId} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                          {asset.assetType === 'VIDEO' ? (
                            <video src={asset.assetUrl} controls className="aspect-video w-full bg-black" />
                          ) : (
                            <img src={asset.assetUrl} alt={asset.assetType} className="aspect-video w-full object-cover" />
                          )}
                          <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{asset.mimeType}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-3">
                      <textarea
                        rows={3}
                        value={revisionDrafts[submission.submissionId] || ''}
                        onChange={(event) => setRevisionDrafts((current) => ({
                          ...current,
                          [submission.submissionId]: event.target.value,
                        }))}
                        placeholder={ui.feedback}
                        className={textareaClassName}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={approveSubmissionMutation.isPending || submission.reviewStatus === 'APPROVED'}
                          onClick={() => approveSubmissionMutation.mutate({
                            agreementId: selectedAgreement.agreementId,
                            submissionId: submission.submissionId,
                          })}
                          className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {ui.approve}
                        </button>
                        <button
                          type="button"
                          disabled={requestRevisionMutation.isPending}
                          onClick={() => {
                            const feedback = (revisionDrafts[submission.submissionId] || '').trim();

                            if (!feedback) {
                              toast.error('Add revision feedback first');
                              return;
                            }

                            requestRevisionMutation.mutate({
                              agreementId: selectedAgreement.agreementId,
                              submissionId: submission.submissionId,
                              feedback,
                            });
                          }}
                          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                        >
                          {ui.requestRevision}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">{ui.payment}</h3>
              {paymentQuery.isLoading ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading payment details...</p>
              ) : !payment ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No payment record returned.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoCard label="Amount" value={money(payment.amount)} />
                    <InfoCard label="Status" value={payment.paymentStatus} />
                    <InfoCard label="Provider" value={payment.provider || 'Not set'} />
                    <InfoCard label="Paid at" value={formatDateTime(payment.paidAt)} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={ui.providerPaymentId}>
                      <input
                        value={paymentForm.providerPaymentId}
                        onChange={(event) => setPaymentForm((current) => ({ ...current, providerPaymentId: event.target.value }))}
                        className={inputClassName}
                      />
                    </Field>
                    <Field label={ui.transactionReference}>
                      <input
                        value={paymentForm.transactionReference}
                        onChange={(event) => setPaymentForm((current) => ({ ...current, transactionReference: event.target.value }))}
                        className={inputClassName}
                      />
                    </Field>
                  </div>
                  <Field label={ui.failureReason}>
                    <textarea
                      rows={3}
                      value={paymentForm.failureReason}
                      onChange={(event) => setPaymentForm((current) => ({ ...current, failureReason: event.target.value }))}
                      className={textareaClassName}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={paymentSuccessMutation.isPending}
                      onClick={handleMarkPaymentSuccess}
                      className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {paymentSuccessMutation.isPending ? ui.updating : ui.markSuccess}
                    </button>
                    <button
                      type="button"
                      disabled={paymentFailureMutation.isPending}
                      onClick={handleMarkPaymentFailure}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
                    >
                      {paymentFailureMutation.isPending ? ui.updating : ui.markFailure}
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section ref={reviewSectionRef} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">{ui.review}</h3>
              {reviewQuery.isLoading ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading review...</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {review?.reviewed ? (
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                      <div className="flex items-center gap-2 text-slate-950 dark:text-white">
                        <StarIcon className="h-5 w-5 fill-current" />
                        <span className="font-semibold">{review.stars} / 5</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{review.comment}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">{ui.noReviewYet}</p>
                  )}

                  <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
                    <Field label={ui.stars}>
                      <select
                        value={reviewForm.stars}
                        onChange={(event) => setReviewForm((current) => ({ ...current, stars: event.target.value }))}
                        className={inputClassName}
                      >
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <option key={stars} value={stars}>{stars}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label={ui.comment}>
                      <textarea
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                        className={textareaClassName}
                      />
                    </Field>
                  </div>

                  <button
                    type="button"
                    disabled={reviewMutation.isPending}
                    onClick={handleSaveReview}
                    className="rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {reviewMutation.isPending ? ui.updating : ui.saveReview}
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </SlideOver>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value }) => (
  <article className="rounded-[26px] border border-[#e8e2d7] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f4_100%)] p-5 shadow-[0_24px_45px_-34px_rgba(15,23,42,0.35)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)]">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      </div>
      <div className="rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </article>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-3 py-3 dark:bg-slate-950">
    <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
  </div>
);

const PaginationBar = ({ pageData, onPrevious, onNext }) => (
  <div className="flex items-center justify-between">
    <p className="text-sm text-slate-500 dark:text-slate-400">
      Page {(pageData?.page || 0) + 1} of {Math.max(pageData?.totalPages || 0, 1)}
    </p>
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!pageData?.hasPrevious}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
      >
        Previous
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!pageData?.hasNext}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
      >
        Next
      </button>
    </div>
  </div>
);

const SlideOver = ({ isOpen, onClose, title, children, wide = false }) => (
  <div className={`fixed inset-0 z-[80] transition ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
    <div
      aria-hidden="true"
      onClick={onClose}
      className={`absolute inset-0 bg-slate-950/35 transition ${isOpen ? 'opacity-100' : 'opacity-0'}`}
    />
    <aside className={`absolute right-0 top-0 h-full w-full ${wide ? 'max-w-[720px]' : 'max-w-[560px]'} border-l border-slate-200 bg-white shadow-2xl transition duration-300 dark:border-slate-800 dark:bg-slate-950 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-2xl border border-slate-300 p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="h-[calc(100%-77px)] overflow-y-auto px-6 py-6">
        {children}
      </div>
    </aside>
  </div>
);

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</span>
    <div className="mt-2">{children}</div>
  </label>
);

const DetailRow = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-900">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="max-w-[70%] text-right font-medium text-slate-900 dark:text-white">{value}</span>
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">{value}</p>
  </div>
);

const inputClassName = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';
const textareaClassName = 'w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary-soft)] dark:border-slate-700 dark:bg-slate-950 dark:text-white';

export default OrderModel;
