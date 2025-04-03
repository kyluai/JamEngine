import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for trying out Vibify',
    features: [
      'Generate 5 playlists per month',
      'Basic music recommendations',
      'Standard audio quality',
      'Ad-supported experience',
    ],
  },
  {
    name: 'Pro',
    price: '$9.99',
    description: 'For music enthusiasts and creators',
    features: [
      'Unlimited playlist generation',
      'Advanced AI recommendations',
      'High-quality audio',
      'Ad-free experience',
      'Custom playlist themes',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For businesses and teams',
    features: [
      'Everything in Pro',
      'API access',
      'Custom integration options',
      'Dedicated account manager',
      'Advanced analytics',
      'SLA guarantees',
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="container px-4">
        <div className="text-center">
          <h2 className="mb-4 text-3xl font-bold">Simple, Transparent Pricing</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Choose the perfect plan for your music discovery journey. All plans include our
            core AI-powered music recommendation engine.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-xl border border-muted p-8"
            >
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="mt-4 text-3xl font-bold">{plan.price}</p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
              
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-8 w-full" variant={index === 1 ? 'default' : 'outline'}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}