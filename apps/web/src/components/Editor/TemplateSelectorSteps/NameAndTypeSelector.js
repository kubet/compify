import { AnimatePresence, motion } from "framer-motion";
import { Folder, Code, Settings } from "lucide-react";
import { InputField } from "@/components/Elements";
import { runtimeList } from "../Templates/common";
import React, { useState, useEffect } from "react";
import QuickStartCard from "@/components/Elements/QuickStartCard";
import LabelButton from "@/components/Elements/LabelButton";
import { useRouter } from "next/navigation";
import getColorFromName from "@/components/Common/GetColorFromName";
import { getRecentlyCreatedComponents } from "@/lib/api";
import ExamplesCard from "./ExamplesCard";
import PreferenceModal from "@/app/create/[id]/modals/PreferenceModal";

function NameAndTypeSelector({
  componentName,
  setComponentName,
  setNameError,
  nameError,
  setStep,
  onSelectTemplate,
}) {
  const router = useRouter();
  const [recentlyCreatedComponents, setRecentlyCreatedComponents] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState(['react']);
  const [preferenceModalOpen, setPreferenceModalOpen] = useState(false);

  // Filter to show only the selected templates
  const quickStartItems = runtimeList.filter(item =>
    selectedTemplates.includes(item.id)
  );

  useEffect(() => {
    getRecentlyCreatedComponents().then((res) => {
      setRecentlyCreatedComponents(res?.data?.recent);
      if (res?.data?.preference?.length !== 0 && res?.data?.preference?.length !== undefined && res?.data?.preference?.length !== null) {
        setSelectedTemplates(res.data.preference);
        setPreferenceModalOpen(false);
      } else {
        setPreferenceModalOpen(true);
      }
    });
  }, []);

  const getTemplateIcon = (template) => {

    const type = runtimeList.find(item => item.id === template).language === 'TypeScript' ? 'ts' : 'js';
    if (type === 'ts') {
      const TSIcon = () => <span className='text-blue-400 font-bold'>TS</span>;
      TSIcon.displayName = 'TSIcon';
      return TSIcon;
    }
    const JSIcon = () => <span className='text-yellow-400 font-bold'>JS</span>;
    JSIcon.displayName = 'JSIcon';
    return JSIcon;
  }

  const validateComponentName = (name) => {
    if (!name || !name.trim()) {
      return "Component name is required";
    }
    if (!/^[A-Z]/.test(name)) {
      return "Component name must start with an uppercase letter";
    }
    if (!/^[A-Za-z0-9_]+$/.test(name)) {
      return "Component name can only contain letters, numbers, and underscores";
    }
    if (name === 'index') {
      return "Component name cannot be 'index'";
    }
    //if longer than 60 characters
    if (name.length > 80) {
      return "Component name cannot be longer than 80 characters";
    }
    return "";
  };

  return (
    <div className="flex flex-col items-center space-y-6 max-w-[450px] mx-auto">
      <motion.h4
        className="text-xl md:text-2xl font-extrabold text-center w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
        initial={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Create a new component
      </motion.h4>
      <div className="w-full">
        <InputField
          value={componentName}
          onChange={(e) => {
            const newName = e.target.value;
            setComponentName(newName);
            const error = validateComponentName(newName);
            setNameError(error);
          }}
          placeholder="Enter component name (e.g. MyComponent)"
          error={nameError}
        />
        {nameError && (
          <p className="text-red-500 text-sm mt-1">{nameError}</p>
        )}
      </div>
      <div className="w-full space-y-3">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center justify-center gap-2">
            <h5 className="text-lg font-semibold text-gray-300">
              Quick Start
            </h5>
            <Settings
              className="w-4 h-4 text-gray-400 hover:text-gray-200 cursor-pointer transition-colors duration-200"
              onClick={() => setPreferenceModalOpen(true)}
            />
          </div>
          <LabelButton onClick={() => setStep(1)} variant="info">
            View all
          </LabelButton>
        </div>
        {quickStartItems.map((item, index) => (
          <QuickStartCard
            key={index}
            name={item.displayName}
            Icon={getTemplateIcon(item.id)}
            color={item.color}
            onClick={() => {
              onSelectTemplate(item.id);
            }}
          />
        ))}
      </div>
      {recentlyCreatedComponents?.length > 0 && (
        <div className="w-full space-y-3">
          <div className="flex flex-row items-center justify-between">
            <h5 className="text-lg font-semibold text-gray-300 mb-2">
              Recently created
            </h5>
            <LabelButton
              onClick={() => router.push("/my-components")}
              variant="info"
            >
              View all
            </LabelButton>
          </div>
          <AnimatePresence
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <QuickStartCard
              name={recentlyCreatedComponents[0]?.name}
              Icon={Code}
              iconClassName="text-yellow-400"
              color={getColorFromName(recentlyCreatedComponents[0]?.id)}
              onClick={() => {
                router.push(`/create/${recentlyCreatedComponents[0]?.id}`);
              }}
            />
          </AnimatePresence>
        </div>
      )}
      <div className="w-full space-y-3 mt-8">
        {/* <div className="flex flex-row items-center justify-between">
                    <h5 className="text-lg font-semibold text-gray-300 mb-2">Example Components</h5>
                    <LabelButton
                        onClick={() => router.push('/examples')}
                        variant="info"
                    >
                        Browse all
                    </LabelButton>
                </div> */}
        <ExamplesCard
          title="Discover Component Examples"
          description="See how it all works in action"
          count="Free components"
          onClick={() => setStep(5)}
        />
      </div>
      <PreferenceModal
        isOpen={preferenceModalOpen}
        defaultTemplates={selectedTemplates}
        onClose={(templates) => {
          if (templates && Array.isArray(templates) && templates.length > 0) {
            setSelectedTemplates(templates);
          }
          setPreferenceModalOpen(false);
        }}
      />

    </div>
  );
}

NameAndTypeSelector.displayName = 'NameAndTypeSelector';

export default NameAndTypeSelector;
