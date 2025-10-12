import { motion } from "framer-motion";

export default function ServiceTile({ icon, title, blurb, bullets = [], price }) {
  return (
    <motion.div
      className="card-soft p-5 bg-white"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start gap-3">
        {/* Animated icon bubble */}
        <motion.div
          className="p-2 rounded-md bg-brand-lightblue/20 text-brand-blue shadow-sm"
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {/* icon passed in (lucide react, etc.) */}
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {icon}
          </motion.div>
        </motion.div>

        <div>
          <div className="font-semibold text-brand-navy">{title}</div>
          <p className="text-sm text-slate-600 mt-1">{blurb}</p>
        </div>
      </div>

      {bullets?.length > 0 && (
        <ul className="mt-3 text-sm text-slate-600 list-disc list-inside space-y-1 marker:text-brand-blue">
          {bullets.map((b) => <li key={b}>{b}</li>)}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between">
        {price && (
          <span className="text-xs rounded-full bg-brand-lightblue/40 text-brand-blue px-2 py-0.5">
            {price}
          </span>
        )}
        <motion.a
          href="/contact"
          className="text-sm font-medium text-brand-blue hover:text-brand-lightblue"
          whileHover={{ x: 2 }}
        >
          Get help →
        </motion.a>
      </div>
    </motion.div>
  );
}
