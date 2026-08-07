import React from 'react'
import { Check, ArrowRight, Code2, Palette, Type, Box } from 'lucide-react'
import { motion } from 'framer-motion'
import LabelButton from '@/components/Elements/LabelButton'
import QuickStartCard from '@/components/Elements/QuickStartCard'

const SummaryCard = ({ icon: Icon, title, children }) => (
    <div className="p-6 rounded-3xl bg-[#19191959] hover:bg-[#191919] border border-[rgb(255,255,255,0.05)] backdrop-blur-sm transition-all duration-300 group">
        <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-[#19191980] group-hover:bg-[#191919] transition-colors">
                <Icon className="w-5 h-5 text-gray-400" />
            </div>
            <h5 className="text-gray-200 font-semibold tracking-wide">{title}</h5>
        </div>
        <div className="space-y-5">
            {children}
        </div>
    </div>
)

const InfoSection = ({ label, value }) => (
    <div>
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <p className="text-gray-100 font-medium text-lg tracking-wide">{value}</p>
    </div>
)

const TagList = ({ label, tags }) => (
    <div>
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
                <span
                    key={index}
                    className="px-3 py-1.5 bg-[#19191980] hover:bg-[#191919] rounded-xl text-sm text-gray-200 font-medium tracking-wide backdrop-blur-sm border border-[rgb(255,255,255,0.05)] transition-colors"
                >
                    {tag}
                </span>
            ))}
        </div>
    </div>
)

function SaveProjectStep({ handleProjectSave, name, runtimeId, uiLibIds, theme, pageSettings }) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div
            className="space-y-8"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <div className="space-y-2">
                <motion.h4
                    className="text-2xl md:text-3xl font-extrabold text-start w-full bg-gradient-to-r from-gray-300 via-gray-500 to-gray-700 bg-clip-text text-transparent"
                    variants={item}
                >
                    Almost there! 🚀
                </motion.h4>

                <motion.p
                    className="text-gray-500 text-lg"
                    variants={item}
                >
                    Review your configuration and create your new project.
                </motion.p>
            </div>

            <motion.div
                className="grid grid-cols-1 md:grid-cols-2  gap-6 auto-rows-fr"
                variants={item}
            >
                <SummaryCard icon={Box} title="Project Details">
                    <InfoSection label="Project Name" value={name} />
                </SummaryCard>

                <SummaryCard icon={Code2} title="Technical Stack">
                    <InfoSection label="Runtime Environment" value={runtimeId} />
                </SummaryCard>

                {uiLibIds?.length > 0 && (
                    <SummaryCard icon={Palette} title="UI Framework">
                        <TagList
                            label="Selected Libraries"
                            tags={uiLibIds}
                        />
                    </SummaryCard>
                )}

                {pageSettings && (
                    <SummaryCard icon={Type} title="Typography">
                        {pageSettings.fontFamily && (
                            <TagList
                                label="Primary Font"
                                tags={[pageSettings.fontFamily]}
                            />
                        )}
                        {pageSettings.fonts?.length > 0 && (
                            <TagList
                                label="Additional Fonts"
                                tags={pageSettings.fonts}
                            />
                        )}
                    </SummaryCard>
                )}
            </motion.div>

            <motion.div
                className="flex justify-end pt-4"
                variants={item}
            >
                <LabelButton
                    onClick={handleProjectSave}
                    variant="info"
                    RightIcon={ArrowRight}
                    className="px-8 py-3 text-base"
                >
                    Create Project
                </LabelButton>
            </motion.div>
        </motion.div>
    )
}

export default SaveProjectStep