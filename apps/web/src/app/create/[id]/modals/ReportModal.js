import { Button } from '@/components/Elements';
import Modal from '@/components/Elements/Modal'
import TextArea from '@/components/Elements/TextArea';
import { reportComponent } from '@/lib/api';
import React, { useState } from 'react'

function ReportModal({ reportModalOpen, setReportModalOpen, id, setToastMessage, setToastType, setShowToast }) {
    const [report, setReport] = useState('');


    const handleReport = async () => {
        const response = await reportComponent(id, report);
        if (response.status === 201) {
            setToastMessage('Component reported');
            setToastType('success');
            setShowToast(true);
            setReportModalOpen(false);
        } else {
            setToastMessage('Failed to report component');
            setToastType('error');
            setShowToast(true);
        }
    }

    return (
        <Modal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            color="hsl(360, 94%, 68%)"
            backdropColor="hsl(360, 94%, 68%)"
        >
            <div className="w-full sm:min-w-[400px]">
                <h2 className="text-2xl font-bold mb-4 text-gray-300 text-center">Report Component</h2>
                <div className="mb-4">
                    <TextArea
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                        placeholder="Describe the reason for reporting this component"
                        className="w-full"
                        rows={3}
                    />
                </div>
                <div className="flex flex-col space-y-3 items-end">
                    <Button
                        onClick={handleReport}
                        variant="full"
                        className="w-full"
                        text="Report"
                        showIcon={false}
                    />
                </div>
            </div>
        </Modal>
    )
}

export default ReportModal