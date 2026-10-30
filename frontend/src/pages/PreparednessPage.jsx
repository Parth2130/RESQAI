import React, { useState } from 'react';
import { 
  Activity, 
  Waves, 
  Flame, 
  Wind, 
  Thermometer, 
  Mountain, 
  Zap, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const PREPAREDNESS_DATA = [
  {
    id: 'earthquake',
    title: 'Earthquake Safety',
    icon: Activity,
    color: 'amber',
    subtitle: 'Seismic tremors, shaking structures & structural aftershocks',
    before: [
      'Fasten heavy shelves and ceiling fixtures securely to walls.',
      'Locate safe spots in each room: under sturdy desks, interior load-bearing walls.',
      'Know where and how to shut off main gas valves and electricity meters.',
      'Keep an emergency Go-Bag with first aid, torch, and radio accessible near the exit.',
      'Participate in building and community mock evacuation drills.'
    ],
    during: [
      'DROP to the ground immediately. COVER under a sturdy table or desk. HOLD ON until shaking stops.',
      'If in bed, stay there and protect your head and neck with a pillow.',
      'Stay away from glass windows, exterior doors, tall bookcases, and masonry.',
      'DO NOT use elevators or rush toward stairwells during shaking.',
      'If outdoors, move to an open area clear of power lines, poles, flyovers, and hoardings.'
    ],
    after: [
      'Check yourself and family members for injuries; administer basic first aid.',
      'Inspect your residence for gas leaks (smell) or damaged electrical lines. Do NOT light matches.',
      'Expect aftershocks. Be prepared to Drop, Cover, and Hold on again.',
      'Tune into official radio broadcasts or verified NDMA channels for updates.',
      'Avoid driving near bridges, ramps, or cracked masonry.'
    ],
    precautions: [
      'Never run outside while shaking is occurring—falling glass and roof tiles are the primary cause of injury.',
      'Do not touch downed power lines or objects in contact with them.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Earthquakes'
  },
  {
    id: 'flood',
    title: 'Flood & Heavy Rainfall Safety',
    icon: Waves,
    color: 'blue',
    subtitle: 'Flash floods, overflowing riverbanks, and monsoon waterlogging',
    before: [
      'Know your local flood risk and elevation relative to streams and nullahs.',
      'Seal important documents (Aadhaar, property deeds, insurance) in watertight zip pouches.',
      'Clear storm drains around your home and elevate sensitive electrical appliances.',
      'Identify the nearest high-ground community shelter or designated relief camp.',
      'Stock non-perishable food and bottled drinking water sufficient for 72 hours.'
    ],
    during: [
      'Never drive, walk, or swim through flowing floodwaters ("Turn Around, Don\'t Drown"). Just 15 cm of moving water can knock an adult off their feet.',
      'Disconnect electrical mains and gas supply if water begins entering the premises.',
      'Move to higher floors or high ground immediately if flash flooding threatens.',
      'Avoid touching electrical equipment if you are wet or standing in water.',
      'Keep listening to local district alerts regarding dam water discharges.'
    ],
    after: [
      'Do not drink tap or flood water until declared safe by authorities; boil all water vigorously.',
      'Watch out for snakes, scorpions, and rodents seeking shelter in dry spots.',
      'Document flood damage with photographs before cleanup for insurance/relief claims.',
      'Discard food items that came into contact with floodwater.',
      'Wear sturdy rubber boots and gloves during mud and debris clearance.'
    ],
    precautions: [
      'Stay away from submerged bridges and causeways.',
      'Underground basements become deadly death traps during sudden flash flooding—evacuate them early.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Floods'
  },
  {
    id: 'cyclone',
    title: 'Cyclone & High Winds Safety',
    icon: Wind,
    color: 'cyan',
    subtitle: 'Tropical coastal storms, gale winds, storm surges & torrential rain',
    before: [
      'Check roof tiles, iron sheets, and loose hoardings; trim overhanging dead tree branches.',
      'Board up or tape large glass windows to prevent flying shards.',
      'Keep portable power banks, batteries, torches, and emergency radios fully charged.',
      'Move livestock and vehicles to safe, elevated concrete enclosures.',
      'Heed official evacuation advisories issued by IMD and state disaster authorities.'
    ],
    during: [
      'Remain indoors in the strongest central room or bathroom away from windows.',
      'Beware of the "Eye of the Cyclone": sudden calm does not mean the storm is over; violent winds will reverse shortly.',
      'Keep all doors and windows tightly shut and bolted.',
      'Unplug electrical equipment to guard against severe power surges and lightning.',
      'Do not venture outdoors under any circumstances until an official "all clear" is given.'
    ],
    after: [
      'Do not touch fallen wires or damaged electric poles.',
      'Beware of damaged trees that may topple in subsequent wind gusts.',
      'Boil drinking water and maintain strict hygiene to prevent water-borne disease outbreaks.',
      'Cooperate with disaster response forces and community rescue teams.'
    ],
    precautions: [
      'Never spread unverified social media rumours during cyclone warnings.',
      'Fishermen and boats must strictly adhere to coastal warnings and stay off the water.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Cyclones'
  },
  {
    id: 'fire',
    title: 'Structural & Wildfire Safety',
    icon: Flame,
    color: 'red',
    subtitle: 'Building fires, electrical short circuits, and dry season scrub fires',
    before: [
      'Install and regularly test smoke alarms; keep an ABC dry chemical extinguisher on each floor.',
      'Practice two clear escape routes from every room with your family.',
      'Never overload electrical extension strips or route cables under rugs.',
      'Keep combustible materials at least 3 feet away from cooking gas and space heaters.',
      'Clear dry leaves, grass, and scrap wood within 30 feet of your house walls.'
    ],
    during: [
      'If smoke is present, CRAWL LOW under the smoke where breathable air remains.',
      'Feel closed doors with the back of your hand; if hot, do NOT open—use your second escape route.',
      'If clothes catch fire: STOP, DROP, and ROLL until flames are smothered.',
      'Never re-enter a burning building once you have exited.',
      'Call Fire Emergency 101 or 112 as soon as you reach a safe location.'
    ],
    after: [
      'Do not enter the building until fire officers declare it structurally sound.',
      'Watch for smoldering embers, roof sagging, and pocket flare-ups.',
      'Have professionals inspect electrical wiring and gas pipelines before turning on.'
    ],
    precautions: [
      'Never use elevators during a building fire.',
      'Keep apartment stairwells, balconies, and fire exits completely unobstructed at all times.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Fire'
  },
  {
    id: 'heatwave',
    title: 'Heatwave & Extreme Heat Safety',
    icon: Thermometer,
    color: 'amber',
    subtitle: 'Severe summer heat, heat exhaustion, and life-threatening heat stroke',
    before: [
      'Insulate roofs and install dark curtains, blinds, or khus screens on sun-facing windows.',
      'Store ample clean drinking water and oral rehydration solution (ORS / Electral) packets.',
      'Plan outdoor labor and errands for early mornings (before 10:00 AM) or evenings.',
      'Provide shaded resting spots and water bowls for street animals and birds.'
    ],
    during: [
      'Drink plenty of water at frequent intervals, even if not feeling thirsty. Consume lemon water, buttermilk, lassi, or coconut water.',
      'Wear loose, lightweight, light-colored cotton clothing and cover head with a cap, cloth, or umbrella.',
      'Avoid strenuous physical exertion outdoors between 12:00 PM and 3:30 PM.',
      'Never leave children, elderly persons, or pets in parked locked vehicles.',
      'If experiencing dizziness, headache, vomiting, or muscle cramps, move immediately to a cool shaded place and sponge with cold water.'
    ],
    after: [
      'Continue aggressive hydration and monitor urine color (pale yellow indicates proper hydration).',
      'Seek prompt medical care at a primary health center if body temperature rises above 104°F (Heat Stroke).'
    ],
    precautions: [
      'Avoid alcohol, tea, and carbonated soft drinks that accelerate dehydration.',
      'Special vigilance is required for construction workers, pregnant women, infants, and seniors.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Heat-Wave'
  },
  {
    id: 'landslide',
    title: 'Landslide & Rockfall Safety',
    icon: Mountain,
    color: 'emerald',
    subtitle: 'Hill slope collapses, debris flows, and heavy monsoon slope failures',
    before: [
      'Observe hillsides around your home for signs of movement: tilting trees, new cracks in soil, or jammed doors.',
      'Plant deep-rooted ground cover vegetation on steep slopes to retain soil stability.',
      'Direct storm runoff water away from unstable slopes and retaining walls.',
      'Know the evacuation routes designated by district hill councils.'
    ],
    during: [
      'Stay alert and awake during intense rainfall; many debris flows occur during night storms.',
      'If near a stream, watch for sudden changes in water clarity (muddy flow indicates upstream collapse).',
      'If a landslide occurs, evacuate immediately uphill or sideways away from the debris path. Never run downhill.',
      'If escape is impossible, curl into a tight ball and protect your head with your arms.'
    ],
    after: [
      'Stay away from the slide area; secondary collapses often occur.',
      'Check for injured or trapped persons without entering directly into active slide zones.',
      'Report broken utility lines to local authorities.'
    ],
    precautions: [
      'Avoid constructing rooms or terraces directly on precarious cuts or natural gullies.',
      'Do not drive across roads covered in fresh loose rocks or mud.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Landslides'
  },
  {
    id: 'lightning',
    title: 'Lightning & Thunderstorm Safety',
    icon: Zap,
    color: 'cyan',
    subtitle: 'Severe electrical thunderstorms and convective lightning strikes',
    before: [
      'Install certified lightning arresters / rods on tall residential and agricultural buildings.',
      'Follow the "30-30 Rule": If time between lightning flash and thunder is under 30 seconds, head indoors. Wait 30 minutes after last thunder before venturing out.'
    ],
    during: [
      'Seek shelter in a substantial enclosed concrete building or hardtop car.',
      'NEVER shelter under isolated tall trees, metal tin sheds, or open bus stops.',
      'Avoid open fields, hill crests, swimming pools, ponds, and tin roofs.',
      'If caught in an open field with hair standing on end: squat low on the balls of your feet, tuck head, cover ears with hands. Do NOT lie flat on the ground.',
      'Stay off corded phones and avoid touching plumbing or wired electronics.'
    ],
    after: [
      'Victims of lightning carry no electrical charge and can be safely touched; administer CPR immediately if breathing has stopped.',
      'Call emergency 108 or 112 for urgent medical transport.'
    ],
    precautions: [
      'Farming tools, motorcycles, bicycles, and umbrellas with metal rods attract lightning—drop them immediately in open fields.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Thunderstorm-Lightning'
  },
  {
    id: 'kit',
    title: '72-Hour Emergency Go-Bag Kit',
    icon: Briefcase,
    color: 'blue',
    subtitle: 'Essential survival kit every family should maintain pre-packed',
    before: [
      'Water: At least 3 litres per person per day for drinking and sanitation (72-hour minimum).',
      'Food: Ready-to-eat dry rations (roasted chana, energy bars, dry fruits, biscuits, canned food).',
      'First Aid Kit: Sterile gauze, bandages, antiseptic liquid (Betadine), burn cream, ORS, paracetamol, personal prescription medications (7-day supply).',
      'Flashlight & Radio: Battery-powered or hand-crank LED torch, AM/FM radio, spare AA/AAA batteries.',
      'Tools: Multi-tool swiss army knife, whistle (to signal rescuers), heavy work gloves, duct tape.',
      'Hygiene: Hand sanitizer, moist towelettes, sanitary pads, toothbrushes, garbage bags.',
      'Power: Fully charged power bank with USB cables in waterproof zip pouch.',
      'Documents & Cash: Photocopies and USB drive of Aadhaar, passports, insurance policies, plus emergency cash in small denominations.'
    ],
    during: [
      'Keep the Go-Bag in an easily accessible location near the front door.',
      'Grab the bag immediately when an evacuation order is broadcast.'
    ],
    after: [
      'Inspect your Go-Bag every 6 months to replace expired medications, food items, and batteries.'
    ],
    precautions: [
      'Tailor the kit for special family needs (infant formula, diapers, senior medication, eyeglasses).'
    ],
    officialLink: 'https://ndma.gov.in/Preparedness'
  }
];

export default function PreparednessPage() {
  const [activeCategory, setActiveCategory] = useState(PREPAREDNESS_DATA[0].id);

  const current = PREPAREDNESS_DATA.find(c => c.id === activeCategory) || PREPAREDNESS_DATA[0];
  const Icon = current.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-resq-border/80">
        <span className="text-xs font-bold uppercase tracking-widest text-resq-cyan block mb-1">
          Life-Safety Protocols
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Disaster Preparedness & Survival Manual
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Science-backed disaster survival instructions structured into Before, During, and After action steps.
        </p>
      </div>

      {/* Category Navigation Ribbon */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {PREPAREDNESS_DATA.map((cat) => {
          const CatIcon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-resq-blue text-white shadow-glow-blue border border-blue-400/30'
                  : 'bg-resq-card text-slate-300 hover:text-white border border-resq-border hover:bg-resq-cardLight'
              }`}
            >
              <CatIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-resq-cyan'}`} />
              <span>{cat.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border-resq-border space-y-8 shadow-xl">
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-resq-border">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-resq-dark flex items-center justify-center text-resq-cyan border border-resq-border shadow-inner">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                {current.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {current.subtitle}
              </p>
            </div>
          </div>

          <div>
            <a
              href={current.officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-resq-dark hover:bg-slate-800 text-xs text-resq-cyan hover:text-white border border-resq-border transition"
            >
              <span>NDMA Guidelines</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 3 Step Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BEFORE */}
          <div className="bg-resq-dark/70 rounded-2xl p-5 border border-resq-border flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm mb-3 pb-2 border-b border-resq-border/60">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">1</span>
                <span>BEFORE: Mitigation & Preparation</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {current.before.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* DURING */}
          <div className="bg-red-950/20 rounded-2xl p-5 border border-red-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm mb-3 pb-2 border-b border-red-500/30">
                <span className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs">2</span>
                <span>DURING: Immediate Survival Action</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {current.during.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* AFTER */}
          <div className="bg-emerald-950/20 rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm mb-3 pb-2 border-b border-emerald-500/30">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
                <span>AFTER: Recovery & Safety Verification</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300">
                {current.after.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Important Precautions */}
        <div className="bg-resq-dark/90 p-5 rounded-2xl border border-resq-border/80">
          <h4 className="font-bold text-amber-300 text-xs sm:text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Critical Life Precautions to Remember
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {current.precautions.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
