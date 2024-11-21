import { createRoot, flushSync } from './x';
import { createStore } from './x';
import { reconcile } from './reconcile';

const Table = props => {
  let rowId, children;
  const onClick = (text, e) => {
      console.log('Clicked' + text);
      e.stopPropagation();
    },
    cells = row => {
      const children = new Array(row.props.length + 1);
      children[0] = <td class="TableCell" textContent={'#' + rowId}/>
      for (let i = 1, len = children.length; i < len; i++) {
        const text = row.props[i - 1];
        children[i] = <td class="TableCell" onClick={[onClick, text]} textContent={text}/>
      }
      return children;
    }

    return <table class="Table"><tbody>
    <For each={props.data.items}>{row => (
      (rowId = row().id),
      (children = cells(row())),
      (<tr class={row().active ? 'TableRow active' : 'TableRow'} data-id={rowId}>{children}</tr>)
    )}</For>
  </tbody></table>;
}

const Anim = props => {
  let boxId;
  return <div class="Anim"><For each={props.data.items}>{box => (
    (boxId = box().id),
    <div class="AnimBox" data-id={boxId} style={({
      "border-radius": (box().time % 10).toString() + 'px',
      background: 'rgba(0,0,0,' + (0.5 + ((box().time % 10) / 10)).toString() + ')'
    })} />
  )}</For></div>
}

const TreeNode = (props) => <ul class="TreeNode">
  <For each={props.data.children}>{node => {
    const n = node();
    const { id, container } = n;
    return container ? <TreeNode data={n}/> : <li class="TreeLeaf" textContent={id}/>
  }}</For>
</ul>;

const Tree = props => <div class="Tree"><TreeNode data={props.data.root}/></div>;

const Main = props => {
  const section = () => {
    const location = props.data.location;
    if (location === 'table') return <Table data={props.data.table} />;
    if (location === 'anim') return <Anim data={props.data.anim} />;
    if (location === 'tree') return <Tree data={props.data.tree} />;
  }
  return <div class="Main">{section()}</div>
}


uibench.init('Solid', 'X Reconcile');
const [state, setState] = createStore({});
createRoot(() => document.querySelector('#App').appendChild(<Main data={state} />))

document.addEventListener('DOMContentLoaded', function (e) {
  uibench.run(
    v => {
      setState(s => {
        reconcile(v, s, { merge: true });
      });
      flushSync();
    },
    samples => {
      document.body.textContent = '';
      document.body.appendChild(<pre>{JSON.stringify(samples, null, ' ')}</pre>);
      flushSync();
    }
  );
});