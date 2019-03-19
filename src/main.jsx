import { createRoot, createState, reconcile, sample } from 'solid-js';
import { r } from 'solid-js/dom';

const Table = ({data}) => {
  const onClick = (e, text) => {
      console.log('Clicked' + text);
      e.stopPropagation();
    },
    cells = row => {
      const children = new Array(row.props.length + 1);
      children[0] = <td class="TableCell" textContent={'#' + row.id}/>
      for (let i = 1, len = children.length; i < len; i++) {
        const text = row.props[i - 1];
        children[i] = <td class="TableCell" model={text} onClick={onClick} textContent={text}/>
      }
      return children;
    }

  return <table class="Table"><tbody>
    <$ each={data.items}>{row =>
      <tr class={(row.active ? 'TableRow active' : 'TableRow')} data-id={row.id}>{cells(row)}</tr>
    }</$>
  </tbody></table>;
}

const Anim = ({data}) =>
  <div class="Anim"><$ each={data.items}>{box =>
    <div class="AnimBox" data-id={box.id} style={({
      borderRadius: (box.time % 10).toString() + 'px',
      background: 'rgba(0,0,0,' + (0.5 + ((box.time % 10) / 10)).toString() + ')'
    })} />
  }</$></div>;

const TreeNode = ({data}) => <ul class="TreeNode">
  <$ each={data.children}>{node =>
    node.container ? <TreeNode data={node}/> : <li class="TreeLeaf" textContent={node.id}/>
  }</$>
</ul>;

const Tree = ({data}) => <div class="Tree"><TreeNode data={data.root}/></div>;

const Main = ({data}) => {
  const section = () => {
    const location = data.location;
    return sample(() => {
      if (location === 'table') return <Table data={data.table} />;
      if (location === 'anim') return <Anim data={data.anim} />;
      if (location === 'tree') return <Tree data={data.tree} />;
    })
  }
  return <div class="Main">{section}</div>
}

uibench.init('Solid', '0.4.2');
const [state, setState] = createState();
createRoot(() => document.querySelector('#App').appendChild(<Main data={state} />))

document.addEventListener('DOMContentLoaded', function (e) {
  uibench.run(
    s => setState(reconcile(s)),
    samples => {
      document.body.textContent = '';
      document.body.appendChild(<pre>{JSON.stringify(samples, null, ' ')}</pre>);
    }
  );
});