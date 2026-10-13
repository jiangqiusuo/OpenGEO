import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Native modal supplies background inertness, focus containment and Escape semantics. */
export function SurfaceDialog({title,kicker,children,onDismiss,returnFocus,className=''}:{title:string;kicker:string;children:ReactNode;onDismiss:()=>void;returnFocus?:HTMLElement|null;className?:string}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const close=useRef<HTMLButtonElement>(null);
  const outsidePress=useRef(false);
  const titleId=useId();
  useEffect(()=>{
    const node=dialog.current!;
    const previous=returnFocus??document.activeElement;
    const alreadyLocked=document.body.classList.contains('drawer-open');
    node.showModal();
    document.body.classList.add('drawer-open');
    close.current?.focus();
    return ()=>{
      if(node.open)node.close();
      if(!alreadyLocked)document.body.classList.remove('drawer-open');
      if(previous instanceof HTMLElement&&previous.isConnected&&previous.getClientRects().length)previous.focus({preventScroll:true});
    };
  },[returnFocus]);
  useEffect(()=>{if(dialog.current?.open)close.current?.focus();},[title]);
  const isOutside=(x:number,y:number)=>{const box=dialog.current!.getBoundingClientRect();return x<box.left||x>box.right||y<box.top||y>box.bottom;};
  return <dialog ref={dialog} className={`surface-dialog ${className}`} aria-labelledby={titleId}
    onKeyDown={event=>{
      if(event.key!=='Tab')return;
      const items=[...event.currentTarget.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,summary,[tabindex]')].filter(item=>item.tabIndex>=0&&!item.hasAttribute('disabled')&&item.getClientRects().length>0);
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&(document.activeElement===first||!event.currentTarget.contains(document.activeElement))){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&(document.activeElement===last||!event.currentTarget.contains(document.activeElement))){event.preventDefault();first?.focus();}
    }}
    onCancel={event=>{event.preventDefault();onDismiss();}}
    onPointerDown={event=>{outsidePress.current=event.target===event.currentTarget&&isOutside(event.clientX,event.clientY);}}
    onClick={event=>{if(outsidePress.current&&event.target===event.currentTarget&&isOutside(event.clientX,event.clientY))onDismiss();outsidePress.current=false;}}>
    <div className="drawer-head"><div><span>{kicker}</span><h2 id={titleId}>{title}</h2></div><button ref={close} onClick={onDismiss} aria-label="关闭详情"><span aria-hidden="true">×</span></button></div>
    {children}
  </dialog>;
}
