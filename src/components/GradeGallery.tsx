import likeNew from '@/assets/grade-like-new.jpg';
import veryGood from '@/assets/grade-very-good.jpg';
import good from '@/assets/grade-good.jpg';
import fair from '@/assets/grade-fair.jpg';
const grades = [
  { name: 'Like New', image: likeNew, description: 'Minimal to no visible signs of use.' },
  { name: 'Very Good', image: veryGood, description: 'Light cosmetic wear, visible only up close.' },
  { name: 'Good', image: good, description: 'Some visible scratches or scuffs.' },
  { name: 'Fair', image: fair, description: 'Noticeable cosmetic wear; screen remains intact.' },
];
export default function GradeGallery() {
  return <section className="py-12 border-t border-border" aria-labelledby="grade-title">
    <h2 id="grade-title" className="text-3xl mb-2">Condition gallery</h2>
    <p className="text-muted-foreground text-sm mb-6">Illustrative examples only. Appearance varies by device; these are not photos of the item you receive.</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {grades.map(g => <div key={g.name} className="border border-border rounded-md overflow-hidden bg-card">
        <img src={g.image} alt={`Illustration of ${g.name} cosmetic condition`} loading="lazy" width={768} height={768} className="w-full aspect-square object-cover" />
        <div className="p-4"><h3 className="text-lg">{g.name}</h3><p className="text-xs text-muted-foreground mt-1">{g.description}</p></div>
      </div>)}
    </div>
  </section>;
}
