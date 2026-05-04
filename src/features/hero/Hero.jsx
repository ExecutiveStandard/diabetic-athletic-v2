import Button from '../../components/Button'
import { useAppStore } from '../../store/appStore'
import homeData from '../../data/home.json'

export default function Hero() {
  const { openModal } = useAppStore()
  const { hero } = homeData

  return (
    <section className="bg-da-dark bg-dots relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-da-cyan/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-da-gold/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="da-container relative z-10 py-20 md:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div className="lg:col-span-7">
            <p className="text-da-cyan uppercase tracking-[0.2em] text-xs md:text-sm font-bold mb-6">
              The Official Website Of Diabetic Athletic
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-5xl xl:text-6xl font-black uppercase leading-[1.05] tracking-tight text-white mb-10">
              Known For Turning <span className="text-da-cyan">Diabetic Struggles</span> Into <span className="highlight-gold">Fitness Successes</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
              <Button
                variant="gradient"
                size="lg"
                onClick={() => openModal('newsletterOpen')}
              >
                Subscribe Now →
              </Button>
              <p className="text-white/60 text-sm font-medium">Join Over 500+ Weekly Readers</p>
            </div>
          </div>

          {/* Right: Coach Photo Placeholder */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-8 bg-gradient-to-br from-da-cyan/30 to-da-gold/30 blur-3xl pointer-events-none"></div>
              <div className="relative aspect-[4/5] bg-gradient-to-br from-da-darker via-da-dark to-black border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-da-cyan/15 via-transparent to-da-gold/15"></div>
                <div className="relative z-10 text-center px-6">
                  <p className="text-white/40 uppercase tracking-wider text-xs mb-2">Coach Photo</p>
                  <p className="text-white/60 font-bold uppercase tracking-wide">Nicholas Caracandas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
