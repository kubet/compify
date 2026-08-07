import React from 'react'

function Privacy() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-12 prose prose-invert">
            <h1 className="text-4xl font-extrabold tracking-tight mb-12">
                Privacy Policy
            </h1>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                1. Introduction
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                This Privacy Policy explains how Compify.app (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses, shares, and protects your personal information. By using our platform, you agree to the collection and use of information in accordance with this policy.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                2. Information Collection
            </h2>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                2.1 Information You Provide
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                We collect information you provide directly to us, including:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Account information (display name, email, password)
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Payment information
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Components and code you create or upload
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Settings and preferences
                </li>
            </ul>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                2.2 Automatically Collected Information
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                When you use our Services, we automatically collect:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Anonymous usage statistics through our privacy-focused analytics that does not use cookies or collect personal information
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Basic device information (browser type, operating system etc.) for functionality
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Anonymous log data (pages visited, visit time etc.)
                </li>
                <li className="text-gray-200 leading-relaxed">
                    For fraud prevention and security purposes, we may collect additional information such as IP addresses, payment attempt patterns, and related security metrics
                </li>
            </ul>

            <p className="text-lg leading-relaxed text-gray-200">
                Payment data is processed and stored by Stripe (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">https://stripe.com/privacy</a>).
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                2.3 AI Processing
            </h3>
            <p className="text-lg leading-relaxed text-gray-200">
                When you intentionally use an AI-assisted feature, the prompt and the component source, files, theme data, or image context needed to answer it may be sent to the configured AI provider. Depending on the feature and deployment configuration, that provider may be OpenAI, Anthropic, OpenRouter, Google, or Groq. Do not submit secrets or personal data in prompts or component files. Each provider processes data under its own privacy and retention terms.
            </p>
            <p className="text-lg leading-relaxed text-gray-200 mt-4">
                On a self-hosted installation, the operator chooses which providers are configured and is responsible for its own privacy notice, retention settings, and subprocessors. AI features remain disabled when no provider credentials are configured.
            </p>

            <h3 className="text-2xl font-semibold mt-8 mb-4">
                2.4 Google User Data
            </h3>

            <p className="text-lg leading-relaxed text-gray-200">
                This section only applies if you sign up or connect your account using Google authentication. We collect:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Google profile information (name and email address) for account creation and management
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Google account email for authentication purposes
                </li>
            </ul>

            <p className="text-lg leading-relaxed text-gray-200">
                We use this data exclusively for:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Creating and managing your account
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Authenticating you when you sign in
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Communicating with you about your account and our services
                </li>
            </ul>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                3. Use of Information
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                We use the collected information to:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Provide and maintain our Services
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Process transactions
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Send essential communications (technical notices, updates, support)
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Respond to your requests and comments
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Analyze usage to improve our platform
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Ensure security and prevent abuse
                </li>
            </ul>

            <p className="text-lg leading-relaxed text-gray-200">
                We retain account data until you delete your account or request removal.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                4. Information Sharing
            </h2>
            <p className="text-lg leading-relaxed text-gray-200">
                We do not sell, rent, or trade your personal information to third parties.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                5. Data Security
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                We implement industry-standard security measures to protect your account:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    HTTPS encryption for all data transmitted between your browser and our servers
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Passwords are securely hashed and salted before storage
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Secure authentication system for account access
                </li>
            </ul>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                6. Your Rights and Choices
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                You have the right to:
            </p>

            <ul className="space-y-3 my-6 list-disc pl-6">
                <li className="text-gray-200 leading-relaxed">
                    Access and update your account information
                </li>
                <li className="text-gray-200 leading-relaxed">
                    Delete your account and associated data
                </li>
            </ul>
            <p className="text-lg leading-relaxed text-gray-200">
                You can manage these through your account settings or by contacting us.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                7. Children&apos;s Privacy
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                Our Services are not directed to children under 18. We do not knowingly collect information from children under 18. If you believe we have collected information from a child under 18, please contact us.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                8. Changes to This Policy
            </h2>

            <p className="text-lg leading-relaxed text-gray-200">
                We may update this Privacy Policy periodically. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date.
            </p>

            <h2 className="text-3xl font-bold mt-12 mb-6">
                9. Contact Us
            </h2>

            <div className="mt-8">
                <p className="mb-4 text-lg text-gray-200">
                    If you have questions about this Privacy Policy, please contact us at:
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
                    Last updated: &ldquo;12/02/2025&rdquo;
                </p>
            </div>
        </div>
    )
}

export default Privacy 