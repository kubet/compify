import React, { useCallback, useState, useEffect } from 'react'
import PricingCard from './PricingCard'
import { cancelSubscription, getAllPlans, getCheckoutSession, getUserSubscriptionPlans, performUpgradeSubscription, previewUpgradeSubscription } from '@/lib/api';
import { useUser } from '@/auth/UseUser';
import { AnimatePresence } from 'framer-motion';
import TextSwitcher from '../Elements/TextSwitcher';
import { motion } from 'framer-motion';
import { Button, Toast } from '../Elements';
import { GradientSpot } from '../Common';
import ConfirmationModal from '../Common/ConfirmationModal';
import Modal from '@/components/Elements/Modal';

const CancelSubscriptionCard = ({ onClick }) => {
    return (
        <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] bg-[#d84d4d0d] p-6 w-full h-full flex flex-col justify-between items-start"
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
                opacity: 0.95,
                boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <motion.div
                className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
                style={{
                    transformStyle: 'preserve-3d',
                }}
            />
            <div className="">
                <h3 className="text-2xl font-semibold mb-4 text-red-300/80">Cancel Subscription</h3>
                <p className="text-gray-400 mb-4">Cancelling your subscription is permanent and cannot be undone. Please proceed with caution.</p>
            </div>
            <div className="w-full flex justify-end">
                <Button
                    text="Cancel Subscription"
                    variant="full"
                    color="red"
                    size="small"
                    showIcon={false}
                    onClick={onClick}
                />
            </div>
        </motion.div>
    )
}

const BillingDetailsCard = ({ currentPlan }) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <motion.div
            className="relative cursor-pointer rounded-3xl shadow-md overflow-hidden border border-[rgba(255,255,255,0.1)] p-6 w-full h-full flex flex-col"
            style={{
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                WebkitMaskImage: '-webkit-radial-gradient(white, black)',
                isolation: 'isolate'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{
                opacity: 0.95,
                boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.5)",
                transition: { duration: 0.3 }
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <motion.div
                className="absolute inset-0 bg-[rgba(255,255,255,0.03)] z-0"
                style={{ transformStyle: 'preserve-3d' }}
            />
            <GradientSpot color="rgba(63,217,185,1)" size={180} position={{ x: '-10%', y: '-10%' }} opacity={0.15} />
            <GradientSpot color="rgba(0,56,68,1)" size={220} position={{ x: '30%', y: '30%' }} opacity={0.2} />

            <h3 className="text-2xl font-semibold mb-4 text-gray-200">Billing {currentPlan?.billingCycle}</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Plan</span>
                    <span className="text-gray-200">{currentPlan?.name || 'Free'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Start Date</span>
                    <span className="text-gray-200">{currentPlan?.startDate ? formatDate(currentPlan.startDate) : 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">End Date</span>
                    <span className="text-gray-200">{currentPlan?.endDate ? formatDate(currentPlan.endDate) : 'N/A'}</span>
                </div>
            </div>
        </motion.div>
    );
};

const SupportModal = ({ isOpen, onClose }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            color='#8B5CF6'
            backdropColor='rgba(139, 92, 246, 0.9)'
        >
            <div className="flex flex-col items-center justify-center px-4 sm:px-8 mx-auto w-full py-4" onClick={(e) => e.stopPropagation()}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-lg relative overflow-hidden"
                >
                    <div className="mb-6">
                        <motion.div
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            className="inline-block p-4 rounded-full bg-white/10"
                        >
                            <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </motion.div>
                    </div>

                    <h2 className="text-3xl font-extrabold mb-4 bg-gradient-to-r from-violet-300 via-violet-400 to-violet-500 bg-clip-text text-transparent">
                        Please Contact Support
                    </h2>
                    <p className="text-gray-400 mb-4 text-lg">
                        We&apos;ve detected some unusual activity with your request. And can&apos;t process your request at this time.
                    </p>
                    <p className="text-violet-400 font-medium text-lg">
                        support@compify.app
                    </p>
                </motion.div>
            </div>
        </Modal>
    );
};

function PaymentPlans({ show = null }) {
    const { user } = useUser();
    const [period, setPeriod] = useState('monthly');
    const [pricingData, setPricingData] = useState({ monthly: [], annually: [] });
    const currentPlans = pricingData?.[period] || [];
    const [toastMsg, setToastMsg] = useState({ text: '', type: '' });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false });
    const [payNowModal, setPayNowModal] = useState({ isOpen: false, price: 0 });
    const isFreePlan = +pricingData?.currentPlan?.price === 0;
    const [supportModal, setSupportModal] = useState({ isOpen: false });
    const loadPlans = useCallback( async () => {
        const resp = await getUserSubscriptionPlans(show);
        setPricingData(resp.data);

        setPeriod(resp.data?.currentPlan?.billingCycle || 'monthly');
    }, [show])

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);

    const getCheckoutLink = async (plan) => {
        if (isFreePlan) {
            const resp = await getCheckoutSession(plan.id);
            if (resp.status === 201) {
                window.location.href = resp.data.url;
            } else {
                setSupportModal({ isOpen: true });
            }
        } else {
            const resp = await previewUpgradeSubscription(plan.id);
            if (resp.status === 201) {
                setPayNowModal({ isOpen: true, price: resp.data.amountDue, planName: plan.name, nextBillingDate: resp.data.nextBillingDate, planId: plan.id });
            } else {
                setToastMsg({ text: 'Failed, please contact support', type: 'error' });
            }
        }
    }

    const handleCancelSubscription = async () => {
        setConfirmationModal({ isOpen: false });
        const resp = await cancelSubscription();
        if (resp.status === 201) {
            setToastMsg({ text: 'Subscription cancelled successfully', type: 'success' });
            loadPlans();
        } else {
            setToastMsg({ text: 'Failed to cancel subscription', type: 'error' });
        }
    }

    const handlePayNow = async () => {
        const resp = await performUpgradeSubscription(payNowModal.planId);
        if (resp.status === 201) {
            setToastMsg({ text: 'Subscription upgraded successfully', type: 'success' });
            setPayNowModal({ isOpen: false, price: 0 });
            loadPlans();
        } else {
            setToastMsg({ text: 'Failed to upgrade subscription', type: 'error' });
            setPayNowModal({ isOpen: false, price: 0 });
        }
    }

    return (
        <div className="w-full min-h-[800px] overflow-hidden">
            <div className="flex justify-center mb-8 mt-1">
                {pricingData?.monthly.length > 0 && <TextSwitcher options={['monthly', 'annually']} value={period} onChange={setPeriod} />}
            </div>
            <div className={`grid grid-cols-1 gap-6 ${currentPlans.length > 1 ? 'md:grid-cols-2' : ''} w-full min-h-[400px] overflow-hidden py-3`}>
                <AnimatePresence>
                    {currentPlans.map((plan, index) => (
                        <PricingCard
                            key={plan.name}
                            name={plan.name}
                            price={plan.price}
                            features={plan.features}
                            bestFor={plan.bestFor}
                            promoData={plan.promoData}
                            current={plan.current}
                            colors={plan.colors || []}
                            buttonText={"Upgrade Plan"}
                            onClick={() => getCheckoutLink(plan)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {+pricingData?.currentPlan?.price !== 0 &&
                <div className="min-h-[300px]">
                    <h3 className="text-2xl font-semibold bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 text-transparent bg-clip-text mt-8">
                        Billing Details
                    </h3>
                    <div className="w-full mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BillingDetailsCard currentPlan={pricingData?.currentPlan} />
                        {pricingData?.currentPlan?.status !== 'cancelled' && <CancelSubscriptionCard onClick={() => setConfirmationModal({ isOpen: true })} />}
                    </div>
                </div>
            }

            {toastMsg.text && <Toast message={toastMsg.text} type={toastMsg.type} onClose={() => setToastMsg({ text: '', type: '' })} />}
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={() => setConfirmationModal({ isOpen: false })}
                onConfirm={handleCancelSubscription}
                title="Cancel Subscription"
                description="Are you sure you want to cancel your subscription? This action cannot be undone."
                confirmText="Yes"
                cancelText="No"
            />
            <ConfirmationModal
                isOpen={payNowModal.isOpen}
                onClose={() => setPayNowModal({ isOpen: false, price: 0 })}
                onConfirm={handlePayNow}
                title={`Pay Now $${payNowModal.price} for ${payNowModal.planName}`}
                description={`Your subscription will be upgraded to ${payNowModal.planName} and your next billing date will be ${new Date(payNowModal?.nextBillingDate * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`}
                confirmText="Yes"
                cancelText="No"
                variant="success"
                backdropColor="hsl(90deg 149.75% 41.13%)"
            />
            <SupportModal
                isOpen={supportModal.isOpen}
                onClose={() => setSupportModal({ isOpen: false })}
            />
        </div>
    )
}

export default PaymentPlans