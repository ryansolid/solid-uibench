import { root, useState, reconcile, sample } from 'solid-js';
import { r } from 'solid-js/dom';

const TableCell = ({ text }) => <td class="TableCell" model={ text } textContent={ text } />;

const TableRow = ({ data }) =>
  <tr class={(data.active ? 'TableRow active' : 'TableRow')} data-id={data.id}>
    <TableCell text={'#' + data.id}></TableCell>
    {data.props.map(c => <TableCell text={c}></TableCell>)}
  </tr>

const Table = ({ data }) => {
  function onClick(e, text) {
    console.log('Clicked' + text);
    e.stopPropagation();
  }

  return <table class="Table"><tbody onClick={onClick}>
    <$ each={data.items}>{i => <TableRow data={i} />}</$>
  </tbody></table>;
}

const AnimBox = ({ data }) => <div class="AnimBox" data-id={data.id} style={({
  borderRadius: (data.time % 10).toString() + 'px',
  background: 'rgba(0,0,0,' + (0.5 + ((data.time % 10) / 10)).toString() + ')'
})} />;

const Anim = ({ data }) => <div class="Anim"><$ each={ data.items }>{i => <AnimBox data={i} />}</$></div>;

const TreeLeaf = ({ data }) => <li class="TreeLeaf">{ data.id }</li>;

const TreeNode = ({ data }) => <ul class="TreeNode">
  <$ each={ data.children }>{c => c.container ? <TreeNode data={c}/> : <TreeLeaf data={c} />}</$>
</ul>;

const Tree = ({ data }) => <div class="Tree"><TreeNode data={data.root} /></div>;

const Main = ({ data }) => {
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

uibench.init('Solid', '0.3.6');
const [state, setState] = useState({});
root(() => document.querySelector('#App').appendChild(<Main data={state} />))

document.addEventListener('DOMContentLoaded', function (e) {
  uibench.run(
    s => setState(reconcile(s)),
    samples => {
      document.body.textContent = '';
      document.body.appendChild(<pre>{JSON.stringify(samples, null, ' ')}</pre>);
    }
  );
});