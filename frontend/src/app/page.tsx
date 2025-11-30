import { WalletConnectButton } from "@/components/WalletConnectButton";
import { ArtisanOnboarding } from "@/components/ArtisanOnboarding";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <header className="relative bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <span className="text-2xl font-bold text-blue-600">ANYWORK</span>
            </div>
            <div className="ml-4">
              <WalletConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
            <h1 className="text-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block text-gray-900">Find Skilled Artisans</span>
              <span className="block text-blue-600">for Your Projects</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-center text-xl text-gray-500 sm:max-w-3xl">
              Connect with verified professionals across Africa. Get reliable
              services with transparent pricing and flexible payment options,
              including crypto.
            </p>
            <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
              <div className="space-y-4 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                <a
                  href="#"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 sm:px-8"
                >
                  Find Artisans
                </a>
                <a
                  href="#artisan-onboarding"
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-gray-50 sm:px-8"
                >
                  Register as Artisan
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative bg-white py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-md px-4 text-center sm:max-w-3xl sm:px-6 lg:max-w-7xl lg:px-8">
          <h2 className="text-base font-semibold uppercase tracking-wider text-blue-600">
            Features
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
            Why Choose ANYWORK?
          </p>
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="pt-6">
                <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Verified Professionals
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Every artisan on our platform is thoroughly vetted and
                      verified for quality and reliability.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="pt-6">
                <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Secure Payments
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      Multiple payment options including cryptocurrency for
                      secure, flexible transactions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="pt-6">
                <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      Quality Guarantee
                    </h3>
                    <p className="mt-5 text-base text-gray-500">
                      We ensure high-quality service delivery and customer
                      satisfaction every time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Artisan onboarding / Self Protocol flow */}
      <section className="max-w-3xl mx-auto px-4 pb-16 sm:px-6 lg:px-8">
        <ArtisanOnboarding />
      </section>
    </div>
  );
}
