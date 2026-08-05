import React from 'react'

function Terms() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
            <h1 className="text-4xl font-extrabold tracking-tight mb-12">
                Terms of Service
            </h1>
            <h2 className="text-3xl font-bold mt-12 mb-6">
                1. Introduction and Definitions
            </h2>
            <h3 className="text-2xl font-semibold mt-8 mb-4">
                1.1 Welcome Statement
            </h3>
            <p className="text-lg leading-relaxed text-gray-200">
                By using our platform, you agree to these Terms and our Privacy Policy.
            </p>
            <p className="text-lg leading-relaxed text-gray-200">
                Compify.app, operated by Compify Tech LLC, provides a web platform for accessing, creating, and sharing web components. Our services include component marketplace with search functionality, component creation and cli tools, subscription-based access to components, and AI-powered features for component generation.
            </p>
            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    &quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot; means Compify Tech LLC
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;Services&quot; means all Compify.app features and services
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;You&quot; means any person or entity using Compify.app
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;Content&quot; means components, code, or any other materials
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;Components&quot; means web components on our platform
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;Public search&quot; means our component sharing system
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;Credits&quot; means our platform&apos;s access credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    &quot;AI Credits&quot; means credits for AI features
                </li>
            </ul>
            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    You must provide accurate registration information
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Automated registrations are not allowed
                </li>
                <li className="text-gray-200 leading-relaxed">
                    One free account per person or entity
                </li>
            </ol>
            <h2 className="text-3xl font-bold mt-12 mb-6">
                2. Account Terms and User Responsibilities
            </h2>
            <h3 className="text-2xl font-semibold mt-8 mb-4">
                2.1 Account Requirements
            </h3>
            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    You must keep your account secure
                </li>
                <li className="text-gray-200 leading-relaxed">
                    You are responsible for all account activity
                </li>
            </ul>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                3. Subscription and Credit System
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                3.1 Subscription Plans
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    We offer various subscription plans:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Free plan with basic features and limited credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Paid plans with additional features and more credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Monthly and annual billing options
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Plan features, limitations, and credit allocations are described on our pricing section
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We reserve the right to modify subscription plans, pricing, and credit systems at any time
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                3.2 Credit System
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Component Credits:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Each plan includes a specified number of monthly component credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credits are used to access components from our public search
                </li>
                <li className="text-gray-200 leading-relaxed">
                    One credit is consumed per component access
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Unused credits restart at the end of the billing cycle
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credits cannot be transferred between users or accounts
                </li>
            </ul>

            <ol start="2" className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    AI Credits:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Plans may include specified AI generation credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    AI credits are separate from component credits
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Unused AI credits restart at the end of the billing cycle
                </li>
            </ul>

            <ol start="3" className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Credit Reward System:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Component creators may earn credits through user interactions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credit earning rates and eligibility are subject to change
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We reserve the right to modify, suspend, or terminate the credit system at any time
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credits have no monetary value and cannot be exchanged, transferred, or refunded
                </li>
            </ul>

            <ol start="4" className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Credit Restrictions:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Credits have no monetary value
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credits cannot be sold, transferred, or exchanged
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credits cannot be converted to cash
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Expired credits cannot be restored
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Credit earning may be subject to review for abuse prevention
                </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                3.3 Payment Terms
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    General Terms:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    All paid plans require a valid payment method that you are authorized to use
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Service continues until the end of your current billing period
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We reserve the right to change pricing with 30 days notice
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Subscriptions:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Automatic billing occurs on the same date each month for monthly subscriptions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Billing dates may adjust to accommodate shorter months for monthly subscriptions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Failed payments may result in immediate service suspension
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Annual billing occurs automatically on your subscription date for annual subscriptions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Promotional rates are subject to change at renewal
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Unused credits expire upon cancellation or plan downgrade
                </li>
            </ul>
            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Credits and Payments:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    All payments are processed in advance
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Purchased credits are non-refundable and non-transferable
                </li>
                <li className="text-gray-200 leading-relaxed">
                    You are responsible for all applicable taxes, processing fees, and charges
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We are not responsible for any bank fees or charges from your payment provider
                </li>
            </ul>



            <h3 className="text-2xl font-semibold mt-8 mb-4">
                3.4 Subscription Changes
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Upgrades:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Take effect immediately
                </li>
                <li className="text-gray-200 leading-relaxed">
                    May be charged on a prorated basis for remainder of billing cycle
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Downgrades:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Plan downgrades require cancellation and resubscription after current period ends
                </li>
                <li className="text-gray-200 leading-relaxed">
                    No refunds for unused time on current plan
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Switching Billing Periods:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    From monthly to annual: Takes effect immediately and may be prorated
                </li>
                <li className="text-gray-200 leading-relaxed">
                    From annual to monthly requires cancellation and resubscription after current period ends
                </li>
            </ul>


            <div>
                <h3 className="text-2xl font-semibold mt-8 mb-4">
                    3.5 Cancellation and Refunds
                </h3>

                <div className="space-y-6">
                    <section>
                        <h4 className="text-xl font-medium mb-3">Subscription Cancellation</h4>
                        <ul className="space-y-2 list-disc pl-6">
                            <li className="text-gray-200 leading-relaxed">
                                You may cancel your subscription at any time through the Manage Payment Plans section or by contacting our support team
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Cancellation takes effect at the end of your current billing period
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Active subscriptions remain accessible until the end of the paid period
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-xl font-medium mb-3">Refund Eligibility</h4>
                        <ul className="space-y-2 list-disc pl-6">
                            <li className="text-gray-200 leading-relaxed">
                                New subscribers are eligible for a full refund within 14 days of their initial purchase, provided they have not used more than 25% of their available credits
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Technical issues that significantly impact service availability will be evaluated for refunds on a case-by-case basis
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                We reserve the right to review and process refund requests individually and may temporarily suspend or modify the refund policy at our discretion to maintain service integrity. This includes the right to decline refunds if we detect patterns of abuse, suspicious activity, or an unusual volume of refund requests that could indicate coordinated actions or potential misuse of our refund system. For refund requests and inquiries, please contact us at the email address listed in the Contact Information section below
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="text-xl font-medium mb-3">Non-Refundable Cases</h4>
                        <ul className="space-y-2 list-disc pl-6">
                            <li className="text-gray-200 leading-relaxed">
                                Partial months or years of service
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Accounts terminated due to violations of our Terms of Service
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Previously completed billing cycles
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Unused credits after the 14-day initial period
                            </li>
                            <li className="text-gray-200 leading-relaxed">
                                Subscriptions where more than 25% of available credits have been used
                            </li>
                        </ul>
                    </section>
                </div>
            </div>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                4. Public search and Component Terms
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                4.1 Component Access
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Public search components are only accessible to registered users and must be explicitly set as public by their creators
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Access requires available credits in your account
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Component Availability and Credit Usage:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Initially available for 24 hours after access
                </li>
                <li className="text-gray-200 leading-relaxed">
                    After 24 hours, access expires and component must be re-accessed
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Each re-access requires a new credit, even for previously accessed components
                </li>
                <li className="text-gray-200 leading-relaxed">
                    The same component may consume multiple credits over time if repeatedly accessed
                </li>
                <li className="text-gray-200 leading-relaxed">
                    To avoid repeated credit usage, components should be forked for permanent access
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Forking Components:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Forking creates a permanent copy in your account
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Forked components don&apos;t require additional credits for access
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Forking is recommended for frequently used components
                </li>
            </ul>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    We do not guarantee continued availability of any marketplace component due to:
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Updates by component creators
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Removals due to policy violations
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Technical changes or incompatibilities
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Creator account termination
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Other factors beyond our control
                </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                4.2 Component Publishing
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Publishers must have an active account
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Published components must comply with our content guidelines
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Components may be removed for policy violations
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Publishing does not guarantee credit earnings
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We reserve the right to review and moderate all published components
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                5. Content Rights and Ownership
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                5.1 Component Usage
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    You retain ownership of code and components you create
                </li>
                <li className="text-gray-200 leading-relaxed">
                    You acknowledge and agree that we may store your content and components.
                </li>
                <li className="text-gray-200 leading-relaxed">
                    You are responsible for backing up your content
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We may remove any content that violates these Terms
                </li>
            </ol>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Public components can be freely used in your projects
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We make no warranties about component functionality, reliability, security, copyright and license compliance
                </li>
                <li className="text-gray-200 leading-relaxed">
                    By publishing components as public, you grant all users that access these components a perpetual, worldwide, non-exclusive, royalty-free license to use, modify, and incorporate these components in their projects
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We are not liable for any issues arising from component usage
                </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                5.2 Prohibited Content
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                You may not create or upload content that:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Infringes on intellectual property rights
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Contains malicious code or security vulnerabilities
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Includes inappropriate content, profanity, or hate speech
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Violates any applicable laws or regulations
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Impersonates others or provides misleading information
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                6. Platform Usage Rules
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                6.1 Acceptable Use
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Use Services for intended purposes only
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Follow any published guidelines or documentation
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Respect platform limitations and restrictions
                </li>
                <li>Service limitations may apply, including but not limited to maximum number of components, component size, storage capacity, and bandwidth usage. These limits may vary by subscription plan and are subject to change at our discretion</li>
                <li className="text-gray-200 leading-relaxed">
                    Comply with all applicable laws
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                6.2 Prohibited Actions
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                You may not:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Attempt to bypass platform restrictions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Reverse engineer the Services
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Launch automated attacks or stress tests
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Scrape or mass download content
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Interfere with other user&apos;s access
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                7. Service Limitations and Warranties
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                7.1 Beta Software Status
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                You expressly acknowledge and agree that:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Compify.app is beta software under active development
                </li>
                <li className="text-gray-200 leading-relaxed">
                    The software may be incomplete and may contain errors, bugs, or security vulnerabilities
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Your use of the software is entirely at your own risk and discretion
                </li>
                <li className="text-gray-200 leading-relaxed">
                    You should regularly backup any important data or content you store on our platform
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                7.2 Service Provision
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Services are provided strictly &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, whether express or implied
                </li>
                <li className="text-gray-200 leading-relaxed">
                    No guarantee of uninterrupted, timely, secure, or error-free service
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We may modify, suspend, or terminate Services at any time without prior notice
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Features, APIs, and functionality may change substantially or be removed without notice
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We expressly disclaim all warranties, including but not limited to merchantability, fitness for a particular purpose, and non-infringement
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                7.3 Technical Limitations
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                We explicitly do not guarantee:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Error-free, bug-free, or secure operation
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Compatibility with any browser, system, or third-party service
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Data preservation, integrity, or recovery in case of failures
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Specific performance levels, response times, or uptime
                </li>
                <li className="text-gray-200 leading-relaxed">
                    That defects or errors will be corrected
                </li>
                <li className="text-gray-200 leading-relaxed">
                    That the software will meet your specific requirements or expectations
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                7.4 Third-Party Services and Content
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    We are not responsible for any third-party services, content, or components accessed through our platform
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Third-party integrations may cease to function at any time
                </li>
                <li className="text-gray-200 leading-relaxed">
                    We make no warranties about the security, reliability, or appropriateness of third-party content
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                8. Liability and Indemnification
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                8.1 Limitation of Liability
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                We are not liable for:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Direct, indirect, or consequential damages
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Lost profits or data
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Service interruptions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Third-party actions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Security breaches
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                8.2 Indemnification
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                You agree to indemnify us against claims arising from:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Your use of Services
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Your content
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Your violations of these Terms
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Your violations of other&apos;s rights
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                9. Termination and Cancellation
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                9.1 Account Termination
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                We may terminate accounts for:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Terms violations
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Extended inactivity
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Abusive behavior
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Any other reason at our discretion
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                9.2 Effect of Termination
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                Upon termination:
            </p>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Access is immediately revoked
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Content may be deleted
                </li>
                <li className="text-gray-200 leading-relaxed">
                    No refunds are provided
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Public components may remain accessible to others
                </li>
            </ol>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                10. Additional Legal Terms
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                10.1 Changes to Terms
            </h3>

            <ol className="space-y-3 my-6 list-decimal pl-6">
                <li className="text-gray-200 leading-relaxed">
                    We may update Terms at any time
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Continued use constitutes acceptance
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Major changes will be announced
                </li>
            </ol>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                10.3 Contact Information
            </h3>

            <div className="mt-12 ">
                <h3 className="text-2xl font-semibold mb-4">
                    10.3 Contact Information
                </h3>
                <p className="mb-4 text-lg text-gray-200">
                    For questions about these Terms, contact:
                </p>
                <ul className="space-y-2 p-4 bg-white/5 rounded-xl">
                    <li className="text-gray-200 flex items-center">
                        <span className="font-medium mr-2">Email:</span>
                        support@compify.app
                    </li>
                    <li className="text-gray-200 flex items-center">
                        <span className="font-medium mr-2">Website:</span>
                        compify.app
                    </li>
                </ul>
            </div>

            <div className="mt-12">
                <p className="text-gray-200 italic">
                    By using Compify.app, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. For information about how we collect, use, and protect your data, please see our <a href="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</a>. Last updated: 09/01/2025
                </p>
            </div>
        </div>
    )
}

export default Terms
