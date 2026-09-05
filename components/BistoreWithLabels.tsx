"use client";

import { useMemo, useState } from "react";
import BistoreApp from "@/components/BistoreApp";
import { AppData, Product, emptyAppData, formatMoney, storageKey } from "@/lib/app-data";
import styles from "./BistoreWithLabels.module.css";

type LabelFields = {
  store: boolean;
  model: boolean;
  color: boolean;
  size: boolean;
  sku: boolean;
  price: boolean;
};

const defaultFields: LabelFields = {
  store: true,
  model: true,
  color: true,
  size: true,
  sku: true,
  price: true,
};

function loadStoredData(): AppData {
  if (typeof window === "undefined") return emptyAppData;
  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as AppData) : emptyAppData;
  } catch {
    return emptyAppData;
  }
}

function labelPrice(product: Product) {
  return product.promotionalPriceCents ?? product.salePriceCents;
}

function LabelCard({ product, storeName, fields }: { product: Product; storeName: string; fields: LabelFields }) {
  const variation = [fields.model ? product.model : "", fields.color ? product.color : "", fields.size ? product.size : ""].filter(Boolean).join(" · ");

  return (
    <article className={styles.thermalLabel}>
      {fields.store && <div className={styles.labelStore}>{storeName}</div>}
      <div className={styles.labelName}>{product.name}</div>
      {variation && <div className={styles.labelVariation}>{variation}</div>}
      <div className={styles.labelFooter}>
        {fields.sku ? <span>{product.sku}</span> : <span />}
        {fields.price && <strong>{formatMoney(labelPrice(product))}</strong>}
      </div>
    </article>
  );
}

export default function BistoreWithLabels() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<AppData>(emptyAppData);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [fields, setFields] = useState<LabelFields>(defaultFields);

  const available = useMemo(
    () => data.products.filter((product) => product.active && product.stock > 0),
    [data.products],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return available;
    return available.filter((product) =>
      [product.name, product.model, product.sku, product.internalCode, product.color, product.size]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [available, query]);

  const labels = useMemo(() => {
    const result: Product[] = [];
    for (const product of available) {
      const quantity = Math.min(product.stock, Math.max(0, selected[product.id] ?? 0));
      for (let index = 0; index < quantity; index += 1) result.push(product);
    }
    return result;
  }, [available, selected]);

  function openLabels() {
    setData(loadStoredData());
    setOpen(true);
  }

  function toggleProduct(product: Product, checked: boolean) {
    setSelected((current) => {
      const next = { ...current };
      if (checked) next[product.id] = Math.max(1, Math.min(product.stock, current[product.id] || 1));
      else delete next[product.id];
      return next;
    });
  }

  function changeQuantity(product: Product, value: number) {
    const quantity = Math.max(1, Math.min(product.stock, Number.isFinite(value) ? value : 1));
    setSelected((current) => ({ ...current, [product.id]: quantity }));
  }

  function selectVisible() {
    setSelected((current) => {
      const next = { ...current };
      for (const product of filtered) next[product.id] = next[product.id] || 1;
      return next;
    });
  }

  function useVisibleStock() {
    setSelected((current) => {
      const next = { ...current };
      for (const product of filtered) next[product.id] = product.stock;
      return next;
    });
  }

  function clearSelection() {
    setSelected({});
  }

  function printLabels() {
    if (!labels.length) return;
    window.print();
  }

  return (
    <div className={styles.wrapper}>
      <BistoreApp />

      <button className={styles.menuButton} type="button" onClick={openLabels} aria-label="Abrir impressão de etiquetas">
        Etiquetas
      </button>

      {open && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="labels-title">
            <header className={styles.modalHeader}>
              <div>
                <span>Impressão térmica</span>
                <h1 id="labels-title">Etiquetas de produtos</h1>
                <p>Selecione apenas itens disponíveis no estoque. Cada etiqueta mede 40 × 20 mm, com 10 mm de intervalo.</p>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Fechar">×</button>
            </header>

            <div className={styles.toolbar}>
              <label className={styles.searchField}>
                <span>Buscar produto</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, SKU, modelo, cor ou tamanho" />
              </label>
              <div className={styles.toolbarActions}>
                <button type="button" onClick={selectVisible}>Selecionar visíveis</button>
                <button type="button" onClick={useVisibleStock}>Qtd. = estoque</button>
                <button type="button" onClick={clearSelection}>Limpar</button>
              </div>
            </div>

            <div className={styles.contentGrid}>
              <div className={styles.productPanel}>
                <div className={styles.sectionHeader}>
                  <strong>Produtos em estoque</strong>
                  <span>{filtered.length} variação(ões)</span>
                </div>
                {filtered.length === 0 ? (
                  <div className={styles.empty}>Nenhum produto com estoque disponível.</div>
                ) : (
                  <div className={styles.productList}>
                    {filtered.map((product) => {
                      const quantity = selected[product.id] ?? 0;
                      const checked = quantity > 0;
                      return (
                        <div className={styles.productRow} key={product.id}>
                          <label className={styles.productCheck}>
                            <input type="checkbox" checked={checked} onChange={(event) => toggleProduct(product, event.target.checked)} />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{[product.model, product.color, product.size].filter(Boolean).join(" · ") || "Sem variação"} · {product.sku}</small>
                            </span>
                          </label>
                          <div className={styles.stockInfo}>
                            <span>Estoque</span>
                            <strong>{product.stock}</strong>
                          </div>
                          <label className={styles.quantityField}>
                            <span>Etiquetas</span>
                            <input
                              type="number"
                              min="1"
                              max={product.stock}
                              disabled={!checked}
                              value={checked ? quantity : 1}
                              onChange={(event) => changeQuantity(product, Number(event.target.value))}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <aside className={styles.previewPanel}>
                <div className={styles.sectionHeader}>
                  <strong>Prévia</strong>
                  <span>{labels.length} etiqueta(s)</span>
                </div>

                <div className={styles.fieldOptions}>
                  {(Object.keys(fields) as Array<keyof LabelFields>).map((key) => {
                    const labelsByKey: Record<keyof LabelFields, string> = {
                      store: "Loja",
                      model: "Modelo",
                      color: "Cor",
                      size: "Tamanho",
                      sku: "SKU",
                      price: "Preço",
                    };
                    return (
                      <label key={key}>
                        <input type="checkbox" checked={fields[key]} onChange={(event) => setFields((current) => ({ ...current, [key]: event.target.checked }))} />
                        {labelsByKey[key]}
                      </label>
                    );
                  })}
                </div>

                <div className={styles.previewLabels}>
                  {labels.length === 0 ? <div className={styles.empty}>Selecione produtos para visualizar as etiquetas.</div> : labels.slice(0, 6).map((product, index) => <LabelCard key={`${product.id}-${index}`} product={product} storeName={data.settings.name} fields={fields} />)}
                </div>
                {labels.length > 6 && <small className={styles.moreLabels}>Prévia limitada a 6. Todas as {labels.length} serão impressas.</small>}

                <div className={styles.printSummary}>
                  <div><span>Formato</span><strong>40 × 20 mm</strong></div>
                  <div><span>Intervalo</span><strong>10 mm</strong></div>
                  <div><span>Total</span><strong>{labels.length}</strong></div>
                </div>
                <button type="button" className={styles.printButton} disabled={!labels.length} onClick={printLabels}>Imprimir etiquetas</button>
                <p className={styles.printHint}>Na janela de impressão, use escala 100%, margens 0 e desative cabeçalhos/rodapés. Configure a mídia da impressora para 40 mm de largura.</p>
              </aside>
            </div>
          </section>
        </div>
      )}

      <div className={styles.printArea} aria-hidden="true">
        {labels.map((product, index) => (
          <div className={styles.printSlot} key={`${product.id}-print-${index}`}>
            <LabelCard product={product} storeName={data.settings.name} fields={fields} />
          </div>
        ))}
      </div>
    </div>
  );
}
