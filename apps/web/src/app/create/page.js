'use client'
import React, { useEffect, useState } from 'react'
import Editor from '@/components/Editor'
import { motion } from 'framer-motion';
import { Button, InputField } from '@/components/Elements';
import { ArrowLeft, Bookmark, Copy, Loader, Save, Share, Share2, Eye, EyeOff } from 'lucide-react';
import { withAuth } from '@/auth/UseUser';
import { checkIfCanCreate, createComponent } from '@/lib/api';
import Toast from '@/components/Elements/Toast';
import { useParams, useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import TemplateSelector from '@/components/Editor/TemplateSelector';
import LabelButton from '@/components/Elements/LabelButton';
import Modal from '@/components/Elements/Modal';
import LoaderCube from '@/components/Common/Loader';
import TextArea from '@/components/Elements/TextArea';
import RadioButton from '@/components/Elements/RadioButton';
import reactInit from '@/components/Editor/Templates/Init/react';
import reactTsInit from '@/components/Editor/Templates/Init/react-ts';
import vueInit from '@/components/Editor/Templates/Init/vue';
import vueTsInit from '@/components/Editor/Templates/Init/vue-ts';
import nextInit from '@/components/Editor/Templates/Init/nextjs';
import ComponentLimit from './[id]/modals/ComponentLimit';
import nextTsInit from '@/components/Editor/Templates/Init/nextts';
import { getUsedDepsForTemplate } from '@/components/Editor/Templates/common';
import reactNativeInit from '@/components/Editor/Templates/Init/react-native';
import reactNativeTsInit from '@/components/Editor/Templates/Init/react-native-ts';

function Create() {
  const router = useRouter();
  const [template, setTemplate] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info');
  const [name, setName] = useState('Untitled1');
  const [step, setStep] = useState(0);
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [canCreate, setCanCreate] = useState(true);
  const getInitFileByTemplate = (template, componentName) => {
    switch (template) {
      case 'react':
        return reactInit(componentName);
      case 'react-ts':
        return reactTsInit(componentName);
      case 'vue':
        return vueInit(componentName);
      case 'vue-ts':
        return vueTsInit(componentName);
      case 'nextjs':
        return nextInit(componentName);
      case 'nextjs-ts':
        return nextTsInit(componentName);
      case 'react-native':
        return reactNativeInit(componentName);
      case 'react-native-ts':
        return reactNativeTsInit(componentName);
      default:
        return '';
    }
  }

  const handleCreateComponent = async (templateId) => {
    const canCreate = await handleCheckIfCanCreate();
    if (!canCreate) {
      setCanCreate(false);
      return;
    }
    const files = getInitFileByTemplate(templateId, name);
    const mainFile = Object.entries(files).find(([_, data]) => data.main);
    const initialActiveFile = mainFile ? mainFile[0] : Object.keys(files)[0];
    const component = {
      name,
      description,
      code: JSON.stringify(files),
      language: templateId,
      activeFile: initialActiveFile,
      usedDeps: getUsedDepsForTemplate(templateId)
    };

    const response = await createComponent(component);
    if (response.status === 201) {
      router.push(`/create/${response.data.id}`, undefined, { shallow: true });
    } else {
      setToastMessage('Failed to create component');
      setToastType('error');
    }
  }

  const handleCheckIfCanCreate = async () => {
    const response = await checkIfCanCreate();
    if (response.status === 201) {
      return true;
    } else {
      return false;
    }
  }


  const renderTopButtons = () => {
    switch (step) {
      case 0:
        return
      case 1:
        return <div className="flex flex-row items-center gap-2">
          <LabelButton
            onClick={() => setStep(0)}
            Icon={ArrowLeft}
            variant="info"
          >
            Back
          </LabelButton>
        </div>
      case 2:
        return <div className="flex flex-row items-center gap-2">
          <LabelButton
            onClick={() => setStep(0)}
            Icon={ArrowLeft}
            variant="info"
          >
            Back
          </LabelButton>
        </div>
      case 5:
        return <div className="flex flex-row items-center gap-2">
          <LabelButton
            onClick={() => setStep(0)}
            Icon={ArrowLeft}
            variant="info"
          >
            Back
          </LabelButton>
        </div>
      default:
        return null
    }

  }

  const renderTitle = () => {
    switch (step) {
      case 0:
        return 'Create component'
      case 1:
        return 'Select runtime'
      case 2:
        return 'Select project'
      case 5:
        return 'Example components'
    }
  }


  return (
    <div className="flex flex-col items-center justify-between px-4 mx-auto w-full max-w-7xl sm:overflow-visible overflow-hidden">
      <div className="flex flex-row items-center justify-between w-full mt-8 mb-4">
        <motion.h4
          className="text-2xl md:text-3xl font-extrabold text-start w-full  bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
          initial={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderTitle()}
        </motion.h4>
        {renderTopButtons()}

      </div>
      <TemplateSelector
        onSelectTemplate={(templateId) => {
          setTemplate(templateId);
          handleCreateComponent(templateId);
        }}
        step={step}
        setStep={setStep}
        name={name}
        setName={setName}
      />
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}

      <ComponentLimit isOpen={!canCreate} onClose={() => setCanCreate(true)} />
    </div>
  )
}

export default withAuth(Create)
