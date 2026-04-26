'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function ReferralTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Referral Program Terms & Conditions</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Program Overview</h2>
              <p className="text-gray-700 mb-4">
                Flora Lawn & Landscaping Inc ("we," "us," or "our") offers a referral program that allows existing customers 
                to earn rewards by referring new customers to our services. By participating in this program, you agree to 
                these Terms and Conditions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>You must be an active customer of Flora Lawn & Landscaping Inc to participate</li>
                <li>You must be at least 18 years old</li>
                <li>You must have a valid account with us</li>
                <li>Referrals must be new customers who have not previously used our services</li>
                <li>You cannot refer yourself or members of your household</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How It Works</h2>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
                <li>Share your unique referral code with friends, family, or colleagues</li>
                <li>When someone uses your referral code and signs up for our services, they become your "referee"</li>
                <li>Once the referee completes their first service and payment, the referral is considered "completed"</li>
                <li>You will be eligible for rewards as outlined in Section 4</li>
                <li>Each person can only use your referral code once</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Rewards</h2>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 p-6 mb-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Current Reward Structure</h3>
                
                <div className="bg-white rounded-lg p-5 mb-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-green-600">🎁</span>
                    For You (Referrer) - Progressive Service Credit System
                  </h4>
                  
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">🚀 Fast Growth (First 5 Referrals):</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg border-2 border-green-300 shadow-sm">
                        <div className="text-xs font-semibold text-green-800 mb-1">1st</div>
                        <div className="text-2xl font-bold text-green-700">$25</div>
                        <div className="text-xs text-green-600 mt-1">+$5</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg border-2 border-green-300 shadow-sm">
                        <div className="text-xs font-semibold text-green-800 mb-1">2nd</div>
                        <div className="text-2xl font-bold text-green-700">$30</div>
                        <div className="text-xs text-green-600 mt-1">+$5</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg border-2 border-green-300 shadow-sm">
                        <div className="text-xs font-semibold text-green-800 mb-1">3rd</div>
                        <div className="text-2xl font-bold text-green-700">$35</div>
                        <div className="text-xs text-green-600 mt-1">+$5</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-100 to-green-200 p-3 rounded-lg border-2 border-green-300 shadow-sm">
                        <div className="text-xs font-semibold text-green-800 mb-1">4th</div>
                        <div className="text-2xl font-bold text-green-700">$40</div>
                        <div className="text-xs text-green-600 mt-1">+$5</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-200 to-green-300 p-3 rounded-lg border-2 border-green-400 shadow-md">
                        <div className="text-xs font-semibold text-green-800 mb-1">5th</div>
                        <div className="text-2xl font-bold text-green-900">$45</div>
                        <div className="text-xs text-green-700 mt-1">+$5</div>
                      </div>
                    </div>
                    
                    <p className="text-sm font-semibold text-gray-700 mb-3">📈 Steady Growth (6th - 25th Referrals):</p>
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">6th</div>
                        <div className="text-base font-bold text-green-600">$47</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">7th</div>
                        <div className="text-base font-bold text-green-600">$49</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">8th</div>
                        <div className="text-base font-bold text-green-600">$51</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">9th</div>
                        <div className="text-base font-bold text-green-600">$53</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">10th</div>
                        <div className="text-base font-bold text-green-600">$55</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">11th</div>
                        <div className="text-base font-bold text-green-600">$57</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">12th</div>
                        <div className="text-base font-bold text-green-600">$59</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">13th</div>
                        <div className="text-base font-bold text-green-600">$61</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">14th</div>
                        <div className="text-base font-bold text-green-600">$63</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">15th</div>
                        <div className="text-base font-bold text-green-600">$65</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">16th</div>
                        <div className="text-base font-bold text-green-600">$67</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">17th</div>
                        <div className="text-base font-bold text-green-600">$69</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">18th</div>
                        <div className="text-base font-bold text-green-600">$71</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">19th</div>
                        <div className="text-base font-bold text-green-600">$73</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">20th</div>
                        <div className="text-base font-bold text-green-600">$75</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">21st</div>
                        <div className="text-base font-bold text-green-600">$77</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">22nd</div>
                        <div className="text-base font-bold text-green-600">$79</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">23rd</div>
                        <div className="text-base font-bold text-green-600">$81</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded border border-green-200 text-center">
                        <div className="text-green-700 mb-1">24th</div>
                        <div className="text-base font-bold text-green-600">$83</div>
                        <div className="text-green-500">+$2</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-200 to-green-300 p-2 rounded-lg border-2 border-green-400 shadow-sm text-center">
                        <div className="text-xs font-semibold text-green-800 mb-1">25th+</div>
                        <div className="text-lg font-bold text-green-900">$100</div>
                        <div className="text-xs text-green-700">Maximum</div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">Note: 6th-24th increase by $2 each. 25th referral reaches maximum of $100.</p>
                  </div>
                  
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 How it works:</strong> Rewards increase progressively with each successful referral. 
                      Your reward amount is based on your total number of completed referrals. 
                      Credits are automatically applied to your next scheduled service.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-blue-600">🎯</span>
                    For Your Referral (Referee)
                  </h4>
                  <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
                    <li>$10-$25 discount on their first service</li>
                    <li>Special introductory pricing for new customers</li>
                  </ul>
                </div>
              </div>

              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Rewards are awarded after the referee completes their first paid service</li>
                <li><strong>Progressive Reward System:</strong> Rewards increase quickly for your first 5 referrals ($25, $30, $35, $40, $45 - increasing by $5 each), then slow down to steady $2 increases from your 6th through 24th referral ($47, $49, $51... up to $83), reaching the maximum of $100 per referral at your 25th referral and beyond</li>
                <li>Service credits are automatically applied to your next scheduled service</li>
                <li>Rewards are typically processed within 7-14 business days after referral completion</li>
                <li>Service credits cannot be exchanged for cash and are non-transferable</li>
                <li>Service credits expire if not used within 90 days of being awarded</li>
                <li>Reward amounts and structure are subject to change without notice</li>
                <li>Only one reward per referral - the same person cannot be referred multiple times</li>
                <li>You must be an active customer with scheduled services to receive and use service credits</li>
                <li>The reward amount is based on your total number of completed referrals, not individual referral value</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Referral Code Usage</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your referral code is unique to you and is meant to be shared with friends, family, and potential customers</li>
                <li>You may share your referral code through social media, email, word of mouth, or other legitimate methods</li>
                <li>You may not use spam, unsolicited emails, or any illegal methods to share your code</li>
                <li>You may not post your referral code on public coupon/deal websites or forums without our permission</li>
                <li>You may not create fake accounts or use multiple accounts to abuse the program</li>
                <li>We reserve the right to revoke your referral code if you violate these terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Prohibited Activities</h2>
              <p className="text-gray-700 mb-4">The following activities are strictly prohibited:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Referring yourself or creating fake accounts</li>
                <li>Using multiple accounts to earn multiple rewards</li>
                <li>Sharing referral codes on coupon or deal websites without our permission</li>
                <li>Using automated systems or bots to generate referrals</li>
                <li>Offering incentives to others in exchange for using your referral code</li>
                <li>Any fraudulent, deceptive, or illegal activity</li>
                <li>Violating any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Referral Status</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Pending:</strong> Someone has used your referral code but hasn't completed their first service yet</li>
                <li><strong>Completed:</strong> The referee has completed their first service and payment</li>
                <li><strong>Rewarded:</strong> You have received your reward for the referral</li>
                <li><strong>Expired:</strong> The referral did not result in a completed service within the time limit</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Reward Processing</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Rewards are typically processed within 7-14 business days after referral completion</li>
                <li>Rewards will be applied to your account or sent via the method we specify</li>
                <li>You are responsible for ensuring your account information is up to date</li>
                <li>We are not responsible for rewards sent to incorrect or outdated information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Program Modifications</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to modify, suspend, or terminate the referral program at any time without notice. 
                We may change reward amounts, eligibility requirements, or program rules at our discretion. Changes will 
                be effective immediately upon posting.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Account Termination</h2>
              <p className="text-gray-700 mb-4">
                We reserve the right to terminate your participation in the referral program, revoke your referral code, 
                and cancel any pending rewards if you violate these terms, engage in fraudulent activity, or if we determine 
                that your participation is harmful to our business or other customers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Flora Lawn & Landscaping Inc shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your participation in the referral program. Our 
                total liability shall not exceed the value of the rewards you have earned.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Privacy</h2>
              <p className="text-gray-700 mb-4">
                Your participation in the referral program is subject to our Privacy Policy. We will use the information 
                you provide to administer the program and communicate with you about your referrals and rewards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Disputes</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions or disputes regarding the referral program, please contact us at 
                <a href="mailto:floralawncareri@gmail.com" className="text-green-600 hover:underline"> floralawncareri@gmail.com</a> 
                or call us at <a href="tel:4013890913" className="text-green-600 hover:underline">(401) 389-0913</a>. 
                We will work with you to resolve any issues in good faith.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="text-gray-700 mb-4">
                These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of 
                Rhode Island, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms and Conditions or the referral program, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Flora Lawn & Landscaping Inc</strong></p>
                <p className="text-gray-700">45 Vernon St, Pawtucket, RI 02860</p>
                <p className="text-gray-700">Phone: <a href="tel:4013890913" className="text-green-600 hover:underline">(401) 389-0913</a></p>
                <p className="text-gray-700">Email: <a href="mailto:floralawncareri@gmail.com" className="text-green-600 hover:underline">floralawncareri@gmail.com</a></p>
              </div>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                By participating in the Flora Lawn & Landscaping Referral Program, you acknowledge that you have read, 
                understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/customer/dashboard"
              className="inline-block px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

