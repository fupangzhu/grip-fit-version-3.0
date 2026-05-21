import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ArrowUpDown, Star, ChevronRight, ChevronLeft, X, Sparkles, Trophy } from 'lucide-react';
import { useFlowState } from '../hooks/useFlowState';
import { scorePhoneForHand } from '../data/scoring';
import { phones, phoneBrands, type Phone } from '../data/phones';
import './PhoneLibraryPage.css';

type SortMode = 'match' | 'price-asc' | 'weight-asc';
type ReleaseFilter = 'all' | '1y' | '2y' | 'older';

const PAGE_SIZE = 6;

export default function PhoneLibraryPage() {
  const navigate = useNavigate();
  const [flow, updateFlow] = useFlowState();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([1000, 12000]);
  const [screenRange, setScreenRange] = useState<[number, number]>([5, 7.2]);
  const [scoreRange, setScoreRange] = useState<[number, number]>([60, 100]);
  const [weightRange, setWeightRange] = useState<[number, number]>([120, 280]);
  const [thicknessRange, setThicknessRange] = useState<[number, number]>([6, 11]);
  const [releaseFilter, setReleaseFilter] = useState<ReleaseFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('match');
  const [page, setPage] = useState(1);

  const ranked = useMemo(() => {
    return phones
      .map((phone) => ({ phone, score: scorePhoneForHand(phone, flow.handLength, flow.handWidth) }))
      .filter(({ phone, score }) => {
        if (selectedBrands.length && !selectedBrands.includes(phone.brand)) return false;
        if (phone.price < priceRange[0] || phone.price > priceRange[1]) return false;
        if (phone.screen < screenRange[0] || phone.screen > screenRange[1]) return false;
        if (phone.weight < weightRange[0] || phone.weight > weightRange[1]) return false;
        if (phone.thickness < thicknessRange[0] || phone.thickness > thicknessRange[1]) return false;
        if (score.match < scoreRange[0] || score.match > scoreRange[1]) return false;
        if (releaseFilter !== 'all') {
          const releaseYear = new Date(phone.releaseDate).getFullYear();
          const now = new Date().getFullYear();
          const diff = now - releaseYear;
          if (releaseFilter === '1y' && diff > 1) return false;
          if (releaseFilter === '2y' && diff > 2) return false;
          if (releaseFilter === 'older' && diff <= 2) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortMode === 'price-asc') return a.phone.price - b.phone.price;
        if (sortMode === 'weight-asc') return a.phone.weight - b.phone.weight;
        return b.score.match - a.score.match;
      });
  }, [flow.handLength, flow.handWidth, selectedBrands, priceRange, screenRange, weightRange, thicknessRange, scoreRange, releaseFilter, sortMode]);

  const totalPages = Math.max(1, Math.ceil(ranked.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visible = ranked.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const top = ranked[0];

  const toggleCompare = (id: string) => {
    const cur = flow.compareIds.includes(id)
      ? flow.compareIds.filter((x) => x !== id)
      : flow.compareIds.length >= 3
        ? flow.compareIds
        : [...flow.compareIds, id];
    updateFlow({ compareIds: cur });
  };

  const toggleFav = (id: string) => {
    const cur = flow.favoriteIds.includes(id)
      ? flow.favoriteIds.filter((x) => x !== id)
      : [...flow.favoriteIds, id];
    updateFlow({ favoriteIds: cur });
  };

  const cycleSort = () => {
    setSortMode((m) => m === 'match' ? 'price-asc' : m === 'price-asc' ? 'weight-asc' : 'match');
  };

  return (
    <div className="library-page">
      <header className="library-page__head">
        <div>
          <h1>最佳匹配在售机型</h1>
          <p>基于人机握持舒适度模型，为你找到最匹配的在售机型。</p>
        </div>
        <button
          type="button"
          className="library-page__compare-btn glass-button"
          onClick={() => navigate('/compare')}
        >
          查看对比 ({flow.compareIds.length})
        </button>
      </header>

      <section className="library-stats">
        <div className="library-stats__item">
          <Sparkles size={18} strokeWidth={1.6} />
          <div>
            <span>匹配机型总数</span>
            <strong>{ranked.length}<small>款</small></strong>
          </div>
        </div>
        <div className="library-stats__item library-stats__item--top">
          <Trophy size={18} strokeWidth={1.6} />
          <div>
            <span>最高匹配度</span>
            <strong>{top ? `${top.score.match.toFixed(1)}%` : '--'}</strong>
            <em>{top ? top.phone.name : '暂无结果'}</em>
          </div>
        </div>
      </section>

      <div className="library-chips">
        <button type="button" className="library-chip" onClick={() => setFilterOpen(true)}>
          匹配度：{scoreRange[0]}-{scoreRange[1]}%
        </button>
        <button type="button" className="library-chip" onClick={() => setFilterOpen(true)}>
          品牌：{selectedBrands.length ? selectedBrands.slice(0, 2).join('/') + (selectedBrands.length > 2 ? '...' : '') : '全部品牌'}
        </button>
        <button type="button" className="library-chip" onClick={() => setFilterOpen(true)}>
          价格：¥{priceRange[0]} - ¥{priceRange[1]}
        </button>
        <button type="button" className="library-chip" onClick={cycleSort}>
          <ArrowUpDown size={11} strokeWidth={1.8} />
          {sortMode === 'match' ? '匹配度从高到低' : sortMode === 'price-asc' ? '价格从低到高' : '重量从轻到重'}
        </button>
        <button type="button" className="library-chip library-chip--accent" onClick={() => setFilterOpen(true)}>
          <Filter size={11} strokeWidth={1.8} />
          筛选
        </button>
      </div>

      <section className="library-table">
        <div className="library-table__head">
          <span>排名</span>
          <span>机型</span>
          <span>关键参数</span>
          <span>匹配度</span>
          <span>评分</span>
          <span>价格</span>
          <span>操作</span>
        </div>
        {visible.map((entry, index) => {
          const phone = entry.phone;
          const rank = (safePage - 1) * PAGE_SIZE + index + 1;
          const inCompare = flow.compareIds.includes(phone.id);
          const isFav = flow.favoriteIds.includes(phone.id);
          return (
            <motion.article
              key={phone.id}
              className="library-row"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * index, duration: 0.32 }}
            >
              <strong className={`library-row__rank ${rank <= 3 && safePage === 1 ? 'is-top' : ''}`}>{rank}</strong>
              <div className="library-row__name">
                <PhoneAvatar phone={phone} />
                <div>
                  <h2>{phone.name}</h2>
                  <p>{phone.releaseDate}</p>
                </div>
              </div>
              <div className="library-row__params">
                <span>{phone.width.toFixed(1)} mm</span>
                <span>·</span>
                <span>{phone.weight} g</span>
                <span>·</span>
                <span>{phone.thickness.toFixed(1)} mm</span>
              </div>
              <div className="library-row__match">
                <MatchPie value={entry.score.match} />
              </div>
              <span className="library-row__grip">{entry.score.total.toFixed(1)}<small>/10</small></span>
              <span className="library-row__price">¥{phone.price.toLocaleString()}</span>
              <div className="library-row__actions">
                <button type="button" className={`library-row__compare ${inCompare ? 'is-active' : ''}`} onClick={() => toggleCompare(phone.id)} aria-label="加入对比">
                  {inCompare ? '已选' : '+ 对比'}
                </button>
                <button type="button" className={`library-row__fav ${isFav ? 'is-active' : ''}`} onClick={() => toggleFav(phone.id)} aria-label="收藏">
                  <Star size={14} strokeWidth={1.6} fill={isFav ? 'currentColor' : 'none'} />
                </button>
                <button type="button" className="library-row__detail" onClick={() => navigate(`/phone/${phone.id}`)} aria-label="查看详情">
                  <ChevronRight size={16} strokeWidth={1.7} />
                </button>
              </div>
            </motion.article>
          );
        })}

        {visible.length === 0 ? <div className="library-empty">无匹配机型，请调整筛选条件</div> : null}
      </section>

      {totalPages > 1 ? (
        <nav className="library-pagination" aria-label="分页">
          <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft size={16} strokeWidth={1.7} />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={safePage === i + 1 ? 'is-active' : ''}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            <ChevronRight size={16} strokeWidth={1.7} />
          </button>
        </nav>
      ) : null}

      <AnimatePresence>
        {filterOpen ? (
          <FilterDrawer
            brands={phoneBrands}
            selectedBrands={selectedBrands}
            toggleBrand={(b) => setSelectedBrands((cur) => cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b])}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            screenRange={screenRange}
            setScreenRange={setScreenRange}
            scoreRange={scoreRange}
            setScoreRange={setScoreRange}
            weightRange={weightRange}
            setWeightRange={setWeightRange}
            thicknessRange={thicknessRange}
            setThicknessRange={setThicknessRange}
            releaseFilter={releaseFilter}
            setReleaseFilter={setReleaseFilter}
            reset={() => {
              setSelectedBrands([]);
              setPriceRange([1000, 12000]);
              setScreenRange([5, 7.2]);
              setScoreRange([60, 100]);
              setWeightRange([120, 280]);
              setThicknessRange([6, 11]);
              setReleaseFilter('all');
            }}
            onClose={() => setFilterOpen(false)}
            resultCount={ranked.length}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PhoneAvatar({ phone }: { phone: Phone }) {
  const colorMap: Record<Phone['color'], string> = {
    titanium: 'linear-gradient(135deg, #9da3ad, #565c66)',
    navy: 'linear-gradient(135deg, #3e5285, #1e2a4a)',
    graphite: 'linear-gradient(135deg, #3a3f48, #1a1d22)',
    silver: 'linear-gradient(135deg, #c8ccd1, #797f88)',
    ivory: 'linear-gradient(135deg, #d2c5b0, #8d8472)',
    green: 'linear-gradient(135deg, #5e8b7c, #2d4a40)',
  };
  return (
    <div className="phone-avatar" style={{ background: colorMap[phone.color] }} aria-hidden>
      <div className="phone-avatar__cam" />
    </div>
  );
}

function MatchPie({ value }: { value: number }) {
  const deg = Math.min(360, Math.max(0, value * 3.6));
  return (
    <div className="match-pie" style={{ ['--match-deg' as never]: `${deg}deg` }}>
      {value.toFixed(1)}<small>%</small>
    </div>
  );
}

type RangeT = [number, number];

function FilterDrawer({
  brands, selectedBrands, toggleBrand,
  priceRange, setPriceRange, screenRange, setScreenRange,
  scoreRange, setScoreRange, weightRange, setWeightRange, thicknessRange, setThicknessRange,
  releaseFilter, setReleaseFilter,
  reset, onClose, resultCount,
}: {
  brands: string[]; selectedBrands: string[]; toggleBrand: (b: string) => void;
  priceRange: RangeT; setPriceRange: (v: RangeT) => void;
  screenRange: RangeT; setScreenRange: (v: RangeT) => void;
  scoreRange: RangeT; setScoreRange: (v: RangeT) => void;
  weightRange: RangeT; setWeightRange: (v: RangeT) => void;
  thicknessRange: RangeT; setThicknessRange: (v: RangeT) => void;
  releaseFilter: ReleaseFilter; setReleaseFilter: (v: ReleaseFilter) => void;
  reset: () => void; onClose: () => void; resultCount: number;
}) {
  return (
    <>
      <motion.div
        className="library-drawer-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="library-drawer glass-card"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        aria-label="筛选抽屉"
      >
        <header className="library-drawer__head">
          <h2>筛选条件</h2>
          <button type="button" className="library-drawer__reset" onClick={reset}>重置</button>
          <button type="button" className="library-drawer__close" onClick={onClose} aria-label="关闭"><X size={16} strokeWidth={1.8} /></button>
        </header>

        <div className="library-drawer__body">
          <section>
            <h3>1 品牌</h3>
            <div className="library-drawer__brands">
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  className={selectedBrands.includes(b) ? 'is-active' : ''}
                  onClick={() => toggleBrand(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>

          <DualRange label="2 价格区间" value={priceRange} min={1000} max={12000} step={100} unit="¥" onChange={setPriceRange} />
          <DualRange label="3 屏幕尺寸" value={screenRange} min={4} max={8} step={0.1} unit="英寸" onChange={setScreenRange} />

          <section>
            <h3>4 上市时间</h3>
            <div className="library-drawer__chips">
              {([['all', '全部'], ['1y', '一年内'], ['2y', '近两年'], ['older', '更早']] as const).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  className={releaseFilter === v ? 'is-active' : ''}
                  onClick={() => setReleaseFilter(v)}
                >
                  {l}
                </button>
              ))}
            </div>
          </section>

          <DualRange label="5 握持评分" value={scoreRange} min={0} max={100} step={1} unit="分" onChange={setScoreRange} />
          <DualRange label="6 机身重量" value={weightRange} min={120} max={280} step={1} unit="g" onChange={setWeightRange} />
          <DualRange label="7 机身厚度" value={thicknessRange} min={6} max={11} step={0.1} unit="mm" onChange={setThicknessRange} />
        </div>

        <footer className="library-drawer__foot">
          <button type="button" className="library-drawer__apply" onClick={onClose}>
            显示 {resultCount} 个结果 →
          </button>
        </footer>
      </motion.aside>
    </>
  );
}

function DualRange({ label, value, min, max, step, unit, onChange }: { label: string; value: RangeT; min: number; max: number; step: number; unit: string; onChange: (v: RangeT) => void }) {
  const lowPct = ((value[0] - min) / (max - min)) * 100;
  const highPct = ((value[1] - min) / (max - min)) * 100;
  return (
    <section className="library-drawer__range">
      <header>
        <h3>{label}</h3>
        <strong>{unit === '¥' ? `¥${value[0]} - ¥${value[1]}` : `${value[0]} - ${value[1]} ${unit}`}</strong>
      </header>
      <div className="dual-range">
        <span className="dual-range__track" />
        <span className="dual-range__fill" style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange([Math.min(e.currentTarget.valueAsNumber, value[1] - step), value[1]])}
          aria-label={`${label} 下限`}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => onChange([value[0], Math.max(e.currentTarget.valueAsNumber, value[0] + step)])}
          aria-label={`${label} 上限`}
        />
        <span className="dual-range__thumb" style={{ left: `${lowPct}%` }} />
        <span className="dual-range__thumb" style={{ left: `${highPct}%` }} />
      </div>
      <footer>
        <span>MIN {min}</span>
        <span>MAX {max}</span>
      </footer>
    </section>
  );
}
